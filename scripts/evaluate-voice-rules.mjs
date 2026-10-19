// Text-only regression and timing evaluation; no training and no model downloads.
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { stable, summarize, fieldScores } from './evaluation/scores.mjs';
import { evaluationNotes } from './evaluation/notes.mjs';
import { loadVoiceModule } from './lib/voice-bundle.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const commands = process.argv.includes('--commands');
const directory = resolve(root, commands ? 'docs/benchmarks/comandos' : 'docs/benchmarks/reglas');
const dataset = await readFile(resolve(root, 'datasets/voz-es/dataset.jsonl'), 'utf8');
const rows = dataset.trim().split('\n').map(JSON.parse);
const { code: implementationCode, exports: implementation } = await loadVoiceModule(
  resolve(root, commands ? 'src/voice/commands/index.ts' : 'src/voice/deterministic.ts'),
);
const interpret = commands
  ? implementation.interpretCommand
  : implementation.interpretDeterministically;
// Warm regex compilation before measuring, without reading annotations or player names.
interpret('Gol nuestro dorsal siete', 'es', ['A', 'B']);
const results = rows.map((row) => {
  const expected = row.answers[0]?.arguments ?? null;
  const start = performance.now();
  const result = interpret(row.query, 'es', row.metadata.teams);
  const elapsedMs = performance.now() - start;
  return {
    id: row.id,
    category: row.metadata.category,
    style: row.metadata.style,
    split: row.metadata.split,
    query: row.query,
    teams: row.metadata.teams,
    expected,
    actual: result.proposal,
    exact: stable(expected) === stable(result.proposal),
    eventKeyword: result.eventKeyword,
    eventMatch: result.eventMatch,
    warnings: result.warnings,
    elapsedMs,
  };
});
const distribution = (field) =>
  Object.fromEntries(
    [...new Set(results.map((row) => row[field]))]
      .sort()
      .map((value) => [value, summarize(results.filter((row) => row[field] === value))]),
  );
const times = results.map((row) => row.elapsedMs).sort((a, b) => a - b);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const report = {
  date: new Date().toISOString(),
  runtime: process.version,
  method: commands
    ? 'ordered voice commands; historical free-form corpus; text only'
    : 'deterministic; text only; no ASR or audio evaluation',
  language: 'es',
  rosterProvided: false,
  datasetSha256: hash(dataset),
  implementationSha256: hash(implementationCode),
  evaluationNotice: commands
    ? 'Historical free-form corpus with unchanged labels and no roster. Results measure compatibility with the old contract, not accuracy on ordered commands or audio.'
    : 'Rules were developed using this synthetic corpus, including its test partition. Partition scores are regression results, not an independent generalization estimate.',
  summary: summarize(results),
  byCategory: distribution('category'),
  byStyle: distribution('style'),
  byPartition: distribution('split'),
  fields: fieldScores(results),
  timingMs: {
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    max: times.at(-1),
  },
  results,
};
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, 'resultado.json'), JSON.stringify(report, null, 2) + '\n');
const notes = commands
  ? `# Comandos ordenados sobre el corpus histórico

Ejecutar: \`npm run voice:evaluate:commands\`.

Este informe ejecuta el parser de producción sobre las ${rows.length} frases originales, sin modificar sus etiquetas y sin proporcionar plantilla ni nombres extraídos de las respuestas. El corpus contiene frases libres, omisión de equipo etiquetada como desconocido, funciones fuera de orden y nombres sin plantilla. El contrato nuevo exige evento, equipo, jugador 1, jugador 2 y metadatos; aplica equipo 1 por defecto y solo reconoce nombres conocidos. Por ello estas métricas describen incompatibilidades con el formato anterior, **no la precisión sobre comandos válidos**.

- Evento: ${report.summary.event.correct}/${report.summary.event.total} (${report.summary.event.percent} %).
- Equipo: ${report.summary.team.correct}/${report.summary.team.total} (${report.summary.team.percent} %).
- Evento y equipo: ${report.summary.eventAndTeam.correct}/${report.summary.eventAndTeam.total} (${report.summary.eventAndTeam.percent} %).
- Respuesta exacta: ${report.summary.exact.correct}/${rows.length} (${report.summary.exact.percent} %).
- Falsos positivos en frases originalmente negativas: ${report.summary.falsePositiveActions}.
- Mediana: ${report.timingMs.p50.toFixed(3)} ms; p95: ${report.timingMs.p95.toFixed(3)} ms en Node ${process.version} de este servidor, sin Whistle/audio y sin plantilla.

Las pruebas de comandos cubren por separado los doce eventos, colores de tarjeta y dorsales 0–99 en siete idiomas, orden de jugadores conocidos/desconocidos y aproximaciones de nombres. No constituyen una evaluación independiente de audio real ni de ruido de pista. El JSON conserva todas las entradas, etiquetas, resultados y hashes, incluidas discrepancias. El corpus anterior se conserva para comparar; no se reetiquetan errores ni se entrena.
`
  : evaluationNotes(report, rows.length);
const failures = results.filter((row) => !row.exact);
await writeFile(resolve(directory, 'LEEME.md'), notes);
console.log(
  JSON.stringify(
    {
      summary: report.summary,
      timingMs: report.timingMs,
      failures: (commands ? failures.slice(0, 12) : failures).map((row) => row.id),
    },
    null,
    2,
  ),
);
