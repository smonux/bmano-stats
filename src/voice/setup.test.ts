import { beforeEach, afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  present: vi.fn(),
  created: vi.fn(),
  engine: { ready: false, prepare: vi.fn(), close: vi.fn() },
}));
vi.mock('./readiness', () => ({ localModelsPresent: mocks.present }));
vi.mock('./engine', () => ({
  VoiceEngine: vi.fn(function (...args: unknown[]) {
    mocks.created(...args);
    return mocks.engine;
  }),
  voiceError: (e: unknown) => (e as Error).message,
}));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.present.mockResolvedValue(true);
  mocks.engine.ready = false;
  mocks.engine.prepare.mockImplementation(async () => {
    mocks.engine.ready = true;
  });
  mocks.engine.close.mockImplementation(async () => {
    mocks.engine.ready = false;
  });
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());
test('requires an explicit language and never loads models before it is selected', async () => {
  const setup = await import('./setup');
  expect(await setup.prepareVoice(true)).toBe(false);
  expect(mocks.engine.prepare).not.toHaveBeenCalled();
  expect(setup.voiceState().languageChosen).toBe(false);
});
test('pre-match setup loads once; changing language reloads local files in offline mode', async () => {
  const setup = await import('./setup');
  await setup.chooseVoiceLanguage('es');
  expect(await setup.prepareVoice(true)).toBe(true);
  expect(mocks.engine.prepare.mock.lastCall?.[1]).toBe(false);
  await setup.prepareVoice(true);
  expect(mocks.engine.prepare).toHaveBeenCalledTimes(1);
  await setup.chooseVoiceLanguage('pl');
  expect(mocks.engine.close).toHaveBeenCalledTimes(1);
  expect(setup.voiceState()).toMatchObject({
    phase: 'cached',
    language: 'pl',
    languageChosen: true,
  });
  expect(await setup.prepareVoice(false)).toBe(true);
  expect(mocks.engine.prepare.mock.lastCall?.[1]).toBe(true);
});
test('refuses ready status if model files were not actually persisted', async () => {
  const setup = await import('./setup');
  await setup.chooseVoiceLanguage('en');
  mocks.present.mockResolvedValue(false);
  expect(await setup.prepareVoice(true)).toBe(false);
  expect(setup.voiceState().phase).toBe('error');
  expect(mocks.engine.close).toHaveBeenCalled();
  expect(() => setup.preparedEngine()).toThrow();
});
test('old Needle and team preferences do not affect command preparation', async () => {
  localStorage.setItem('handball-needle-depth', '20');
  localStorage.setItem('handball-voice-default-team', 'equipo2');
  const setup = await import('./setup');
  await setup.chooseVoiceLanguage('es');
  await setup.prepareVoice(true);
  expect(mocks.created).toHaveBeenLastCalledWith('es');
  expect(setup.voiceState()).not.toHaveProperty('needleDepth');
  expect(setup.voiceState()).not.toHaveProperty('defaultTeam');
});
test('discarding preparation cannot resurrect a closed engine or mark voice ready', async () => {
  const setup = await import('./setup');
  await setup.chooseVoiceLanguage('es');
  let finish!: () => void;
  mocks.engine.prepare.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const preparing = setup.prepareVoice(true);
  const disposing = setup.discardVoiceEngine();
  finish();
  expect(await preparing).toBe(false);
  await disposing;
  expect(setup.voiceState().phase).toBe('cached');
  expect(() => setup.preparedEngine()).toThrow();
});
test('discarding during cache verification cannot restore ready status', async () => {
  const setup = await import('./setup');
  await setup.chooseVoiceLanguage('es');
  let confirm!: (present: boolean) => void;
  mocks.present.mockImplementationOnce(
    () =>
      new Promise<boolean>((resolve) => {
        confirm = resolve;
      }),
  );
  const preparing = setup.prepareVoice(true);
  await vi.waitFor(() => expect(confirm).toBeTypeOf('function'));
  const disposing = setup.discardVoiceEngine();
  confirm(true);
  expect(await preparing).toBe(false);
  await disposing;
  expect(setup.voiceState().phase).toBe('cached');
  expect(() => setup.preparedEngine()).toThrow();
});
