import { beforeEach, expect, test, vi } from 'vitest';
import { languages } from '../i18n';
const mocks = vi.hoisted(() => ({
  transcribe: vi.fn(async (_audio: unknown, _options: unknown) => ({ text: 'test' })),
  close: vi.fn(),
  createWhistle: vi.fn(),
  createNeedle: vi.fn(),
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
});
test('prepares the unchanged Whistle model without loading Needle, then releases it', async () => {
  const engine = new VoiceEngine('es');
  await engine.prepare(() => {}, true);
  expect(engine.ready).toBe(true);
  expect(mocks.createWhistle.mock.lastCall?.[0]).toMatchObject({ offline: true });
  expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('model');
  expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('modelSha256');
  expect(mocks.createNeedle).not.toHaveBeenCalled();
  await engine.close();
  expect(engine.ready).toBe(false);
  expect(mocks.close).toHaveBeenCalledOnce();
});
test('all seven languages and keyword hints reach Whistle unchanged', async () => {
  for (const language of Object.keys(languages) as (keyof typeof languages)[]) {
    const engine = new VoiceEngine(language);
    await engine.prepare(() => {});
    await engine.transcribe(new Float32Array(100), 16000, ['example']);
    expect(mocks.transcribe.mock.lastCall?.[1]).toMatchObject({ language, keywords: ['example'] });
    await engine.close();
  }
  expect(mocks.createNeedle).not.toHaveBeenCalled();
});
test('uses the command parser for the actual proposal, respecting player order and default team one', async () => {
  const engine = new VoiceEngine('es');
  const result = await engine.interpret(
    'gol 23 Ana penalti',
    ['La Jota', 'Rival'],
    [{ name: 'Ana', dorsal: 7, team: 'equipo1' }],
  );
  expect(result.proposal).toEqual({
    evento: 'gol',
    equipo: 'equipo1',
    dorsal: 23,
    dorsal_relacionado: 7,
    penalti: true,
  });
  expect(result.timing).toMatchObject({ method: 'commands', needleMs: 0 });
  expect(result.warnings.join(' ')).toContain('revisa');
  expect(mocks.createNeedle).not.toHaveBeenCalled();
});
test('unknown events remain pending rather than inventing a goal', async () => {
  const result = await new VoiceEngine('es').interpret('vamos chicos', ['A', 'B']);
  expect(result.proposal).toEqual({ evento: 'desconocido', equipo: 'equipo1' });
  expect(result.timing.needleMs).toBe(0);
});
test('failed preparation cannot mark a partial engine ready', async () => {
  mocks.createWhistle.mockRejectedValueOnce(new Error('missing model'));
  const engine = new VoiceEngine();
  await expect(engine.prepare(() => {}, true)).rejects.toThrow('missing model');
  expect(engine.ready).toBe(false);
});
