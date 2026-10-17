// Real inference with a fixed schema. No phrase lookup or output correction.
import { createNeedle } from 'cactus-needle';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { extractionSchema, perspectiveFor } from '../src/voice/interpretation';
const tools = {
  registrar_jugada: {
    description:
      'Extract a single handball play from the recording language. Copy only explicitly mentioned facts.',
    inputSchema: {
      ...extractionSchema,
      properties: {
        ...extractionSchema.properties,
        equipo: {
          type: 'string',
          description: perspectiveFor('es') + ' Or copy the mentioned team name verbatim.',
        },
      },
    },
  },
};
const system = 'locale:es; sport:handball';
const samples = [
  'Gol nuestro, dorsal siete.',
  'Acaba de marcar el siete de los nuestros.',
  'Parada rival, dorsal uno, lanzamiento de nuestro dorsal nueve.',
  'Exclusión de dos minutos para el rival.',
];
const output = process.env.BENCH_OUTPUT ?? 'test-results/needle-prefix-node.json';
await mkdir(resolve(output, '..'), { recursive: true });
const modelPath =
  process.env.NEEDLE_MODEL_PATH ??
  resolve(process.env.VOICE_MODELS_DIR ?? '/tmp/bmano-voice', 'needle3.cact');
const report = {
  runtime: 'Node.js / bundled WASM (not a browser measurement)',
  date: new Date().toISOString(),
  modelPath,
  training: false,
  tools,
  system,
  results: [] as unknown[],
};
const started = performance.now();
const needle = await createNeedle({
  modelPath,
  stateless: true,
  tools,
  system,
  maxOutputTokens: 192,
});
console.log('LOAD', performance.now() - started);
try {
  // First empty completion computes the reusable prefix. No event is created.
  const start = performance.now();
  const warmup = await needle.complete('', { maxNewTokens: 192 });
  report.results.push({ phase: 'warmup', elapsedMs: performance.now() - start, result: warmup });
  console.log('WARMUP', performance.now() - start);
  for (const text of samples) {
    const before = performance.now();
    const result = await needle.complete(text, {
      maxNewTokens: 192,
      abortSignal: AbortSignal.timeout(65000),
    });
    const row = { text, elapsedMs: performance.now() - before, result };
    report.results.push(row);
    await writeFile(output, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(row));
  }
} finally {
  await needle.close();
}
