// Text-only regression and timing evaluation; no training and no model downloads.
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { stable, summarize, fieldScores } from './evaluation/scores.mjs';
import { evaluationNotes } from './evaluation/notes.mjs';
import { loadVoiceModule } from './lib/voice-bundle.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, 'docs/benchmarks/reglas');
const dataset = await readFile(resolve(root, 'datasets/voz-es/dataset.jsonl'), 'utf8');
const rows = dataset.trim().split('\n').map(JSON.parse);
const {
  code: implementationCode,
  exports: { interpretDeterministically: interpret },
} = await loadVoiceModule(resolve(root, 'src/voice/deterministic.ts'));
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
  method: 'deterministic; text only; no ASR or audio evaluation',
  language: 'es',
  rosterProvided: false,
  datasetSha256: hash(dataset),
  implementationSha256: hash(implementationCode),
  evaluationNotice:
    'Rules were developed using this synthetic corpus, including its test partition. Partition scores are regression results, not an independent generalization estimate.',
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
const notes = evaluationNotes(report, rows.length);
const failures = results.filter((row) => !row.exact);
await writeFile(resolve(directory, 'LEEME.md'), notes);
console.log(
  JSON.stringify(
    { summary: report.summary, timingMs: report.timingMs, failures: failures.map((row) => row.id) },
    null,
    2,
  ),
);
