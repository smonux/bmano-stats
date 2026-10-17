// Small, reproducible text experiment with real Needle weights. No audio or training.
import { createNeedle } from 'cactus-needle';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { extractionFacts, toolForEvent } from '../src/voice/play-schema';
import { routeVoiceEvent } from '../src/voice/event-routing';
import { adaptNeedleResult } from '../src/voice/hybrid';
import { NEEDLE_DEPTHS, needleArtifacts, type NeedleDepth } from '../src/voice/model-artifacts';

const depths = (process.env.BENCH_DEPTHS ?? '12').split(',').map(Number);
if (depths.some((depth) => !NEEDLE_DEPTHS.includes(depth as NeedleDepth))) {
  throw new Error('BENCH_DEPTHS must contain 4, 8, 12 or 20.');
}
const teams = ['La Jota', 'Leones'];
const samples = [
  'Gol nuestro, dorsal siete.',
  'Nos han marcado gol, dorsal nueve.',
  'gol nuestro del 7 pase d ana',
  'Gol del siete.',
];
const results = [];
for (const depth of depths as NeedleDepth[]) {
  const artifact = needleArtifacts[depth];
  const modelPath = artifact.file
    ? resolve('public/models', artifact.file)
    : resolve(process.env.VOICE_MODELS_DIR ?? 'node_modules/.cache/voice-models', 'needle3.cact');
  const loading = performance.now();
  const needle = await createNeedle({
    modelPath,
    stateless: true,
    system: extractionFacts('es', 'equipo1'),
    maxOutputTokens: 192,
  });
  const loadMs = performance.now() - loading;
  try {
    for (const text of samples) {
      const routed = routeVoiceEvent(text, 'es', teams);
      if (!routed.event) throw new Error('Benchmark sample could not be routed.');
      const start = performance.now();
      const raw = await needle.complete(text, {
        tools: toolForEvent(routed.event, teams, 'equipo1'),
        maxNewTokens: 192,
        abortSignal: AbortSignal.timeout(45_000),
      });
      const needleMs = performance.now() - start;
      const interpreted = adaptNeedleResult(routed.event, raw, 'equipo1');
      results.push({ depth, text, loadMs, needleMs, ...interpreted, raw });
      console.log(JSON.stringify({ depth, text, needleMs: Math.round(needleMs), ...interpreted }));
    }
  } finally {
    await needle.close();
  }
}
const output = resolve(process.env.BENCH_OUTPUT ?? 'test-results/hybrid-needle.json');
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  JSON.stringify(
    {
      date: new Date().toISOString(),
      runtime: process.version,
      configuration: {
        language: 'es',
        teams,
        defaultTeam: 'equipo1',
        maxNewTokens: 192,
        system: extractionFacts('es', 'equipo1'),
        tools: toolForEvent('gol', teams, 'equipo1'),
        models: needleArtifacts,
      },
      notice:
        'Single runs of four synthetic Spanish texts on server Node/WASM. Not Android, ASR or an independent accuracy evaluation.',
      results,
    },
    null,
    2,
  ) + '\n',
);
