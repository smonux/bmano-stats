import { beforeEach, expect, test, vi } from 'vitest';
import { languages } from '../i18n';
const mocks = vi.hoisted(() => ({
  transcribe: vi.fn(async (_audio: unknown, _options: unknown) => ({ text: 'test' })),
  close: vi.fn(),
  createWhistle: vi.fn(),
  createNeedle: vi.fn(),
  complete: vi.fn(),
  closeNeedle: vi.fn(),
}));
vi.mock('cactus-needle/browser', async (original) => ({
  ...(await original<typeof import('cactus-needle/browser')>()),
  createWhistle: mocks.createWhistle,
  createNeedle: mocks.createNeedle,
}));
import { VoiceEngine } from './engine';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.createWhistle.mockResolvedValue({ transcribe: mocks.transcribe, close: mocks.close });
  mocks.createNeedle.mockResolvedValue({ complete: mocks.complete, close: mocks.closeNeedle });
  mocks.complete.mockResolvedValue({
    success: true,
    function_calls: [{ name: 'gol', arguments: { equipo: 'equipo2', dorsal: 7 } }],
    suppressed_calls: [],
    confidence: 0.9,
  });
});
test('prepares unchanged Whistle and the selected Needle, then releases both', async () => {
  const engine = new VoiceEngine('es', 8);
  await engine.prepare(() => {}, true);
  expect(engine.ready).toBe(true);
  expect(mocks.createWhistle.mock.lastCall?.[0]).toMatchObject({ offline: true });
  expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('model');
  expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('modelSha256');
  expect(mocks.createNeedle.mock.lastCall?.[0]).toMatchObject({
    offline: true,
    model: expect.stringContaining('needle3-8l-'),
    stateless: true,
    modelSha256: expect.any(String),
  });
  await engine.close();
  expect(engine.ready).toBe(false);
  expect(mocks.close).toHaveBeenCalledTimes(1);
  expect(mocks.closeNeedle).toHaveBeenCalledTimes(1);
});
test('all seven languages still reach Whistle unchanged', async () => {
  for (const language of Object.keys(languages) as (keyof typeof languages)[]) {
    const engine = new VoiceEngine(language);
    await engine.prepare(() => {});
    await engine.transcribe(new Float32Array(100), 16000, ['example']);
    expect(mocks.transcribe.mock.lastCall?.[1]).toMatchObject({ language, keywords: ['example'] });
    await engine.close();
  }
  expect(mocks.createNeedle).toHaveBeenCalledTimes(7);
});
test('routes only the event and lets Needle interpret the untouched transcript and team', async () => {
  const engine = new VoiceEngine('es');
  await engine.prepare(() => {}, true);
  const result = await engine.interpret(
    'Nos han marcado gol, dorsal siete?',
    ['La Jota', 'Rival'],
    [{ name: 'Ana María', team: 'equipo1' }],
  );
  expect(result.proposal).toEqual({ evento: 'gol', equipo: 'equipo2', dorsal: 7 });
  expect(mocks.complete).toHaveBeenCalledWith(
    'Nos han marcado gol, dorsal siete?',
    expect.objectContaining({
      tools: expect.objectContaining({ gol: expect.any(Object) }),
    }),
  );
  const properties = mocks.complete.mock.lastCall?.[1].tools.gol.inputSchema.properties;
  expect(properties).toHaveProperty('nombre_asistente');
  expect(properties).toHaveProperty('penalti');
  expect(properties).not.toHaveProperty('evento');
  expect(result.timing.method).toBe('hybrid');
  expect(result.timing.needleMs).toBeGreaterThanOrEqual(0);
  expect(result.warnings.join(' ')).toContain('revisa');
});
test('unknown events retain the default team without calling Needle or inventing a goal', async () => {
  const engine = new VoiceEngine('es', 12, 'equipo2');
  const result = await engine.interpret('vamos chicos', ['A', 'B']);
  expect(result.proposal).toEqual({ evento: 'desconocido', equipo: 'equipo2' });
  expect(mocks.complete).not.toHaveBeenCalled();
  expect(result.timing.needleMs).toBe(0);
});
test('failed preparation closes Whistle and never marks a partial engine ready', async () => {
  mocks.createNeedle.mockRejectedValueOnce(new Error('missing model'));
  const engine = new VoiceEngine();
  await expect(engine.prepare(() => {}, true)).rejects.toThrow('missing model');
  expect(engine.ready).toBe(false);
  expect(mocks.close).toHaveBeenCalledOnce();
});
