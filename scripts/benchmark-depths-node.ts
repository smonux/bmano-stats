// Same bundled WASM engine under Node. No HTTP server, training or phrase routing.
import { createNeedle } from 'cactus-needle';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const tools = {
  record_play: {
    description: 'Record one handball play.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'goal',
            'save',
            'miss',
            'loss',
            'recovery',
            'penalty',
            'exclusion',
            'yellow',
            'disqualification',
            'passive',
            'infraction',
            'unknown',
          ],
        },
        team: {
          type: 'string',
          enum: ['our', 'opponent', 'unknown'],
          description: 'Team performing the action, from the recorder perspective.',
        },
        shirt: {
          type: 'integer',
          minimum: 0,
          maximum: 99,
          description: 'Primary player shirt number.',
        },
        related: {
          type: 'integer',
          minimum: 0,
          maximum: 99,
          description: 'Assist provider for goal; opposing player for other actions.',
        },
        name: { type: 'string', description: 'Primary player name, verbatim.' },
        related_name: { type: 'string', description: 'Related player name, verbatim.' },
        penalty: { type: 'boolean', description: 'Seven metre shot.' },
        blue: { type: 'boolean', description: 'Blue card.' },
        infraction: { type: 'string', enum: ['steps', 'double_dribble', 'goal_area'] },
      },
      required: ['action', 'team'],
      additionalProperties: false,
    },
  },
};
const cases = [
  { text: 'Gol nuestro, dorsal siete.', expected: { action: 'goal', team: 'our', shirt: 7 } },
  {
    text: 'Acaba de marcar el siete de los nuestros.',
    expected: { action: 'goal', team: 'our', shirt: 7 },
  },
  {
    text: 'Parada rival, dorsal uno, lanzamiento de nuestro dorsal nueve.',
    expected: { action: 'save', team: 'opponent', shirt: 1, related: 9 },
  },
  {
    text: 'Exclusión de dos minutos para el rival.',
    expected: { action: 'exclusion', team: 'opponent' },
  },
];
const modelDir = process.env.VOICE_MODELS_DIR ?? '/tmp/bmano-voice';
const depthDir = process.env.BENCH_DEPTH_DIR ?? resolve(modelDir, 'depths');
const manifest = JSON.parse(await readFile(resolve(depthDir, 'depths.json'), 'utf8'));
const depths = (process.env.BENCH_DEPTHS ?? '20,12,8').split(',').map(Number);
const output = process.env.BENCH_OUTPUT ?? 'test-results/needle-depths-node.json';
await mkdir(resolve(output, '..'), { recursive: true });
const report = {
  runtime: 'Node.js / bundled WASM (not a browser measurement)',
  date: new Date().toISOString(),
  training: false,
  tools,
  results: [] as unknown[],
};
for (const depth of depths) {
  const artifact = manifest.models.find((model: { depth: number }) => model.depth === depth);
  const modelPath =
    depth === 20 ? resolve(modelDir, 'needle3.cact') : resolve(depthDir, artifact.path);
  const needle = await createNeedle({
    modelPath,
    stateless: true,
    system: 'locale:es; sport:handball; our team:La Jota; opponent team:Rival',
    maxOutputTokens: 192,
  });
  try {
    for (const sample of cases) {
      console.log('BENCH', depth, sample.text);
      const before = performance.now();
      const result = await needle.complete(sample.text, {
        tools,
        maxNewTokens: 192,
        abortSignal: AbortSignal.timeout(65000),
      });
      const calls = [...result.function_calls, ...result.suppressed_calls];
      const args = calls.length === 1 ? calls[0].arguments : {};
      const requiredFieldsCorrect =
        result.success &&
        calls.length === 1 &&
        Object.entries(sample.expected).every(([key, value]) => args[key] === value);
      const correct =
        requiredFieldsCorrect &&
        !result.validation?.ungrounded?.length &&
        !result.validation?.negation &&
        !Object.keys(args).some((key) => !(key in sample.expected));
      const row = {
        depth,
        ...sample,
        elapsedMs: performance.now() - before,
        requiredFieldsCorrect,
        correct,
        result,
      };
      report.results.push(row);
      await writeFile(output, JSON.stringify(report, null, 2) + '\n');
      console.log(JSON.stringify(row));
    }
  } finally {
    await needle.close();
  }
}
