import { afterEach, expect, test, vi } from 'vitest';
import { DEFAULT_MODEL, DEFAULT_SPEECH_MODEL } from 'cactus-needle/browser';
import { checkMicrophone, localModelsPresent, microphoneProblem } from './readiness';
import { needleModel } from './needle-model';
afterEach(() => vi.unstubAllGlobals());
test('checks real cache entries and sizes rather than a remembered readiness flag', async () => {
  vi.stubGlobal('caches', undefined);
  expect(await localModelsPresent()).toBe(false);
  const match = vi.fn(async (_key: string) => undefined as unknown);
  const has = vi.fn(async () => false);
  vi.stubGlobal('caches', { has, open: async () => ({ match }) });
  expect(await localModelsPresent()).toBe(false);
  has.mockResolvedValue(true);
  match.mockResolvedValue({ blob: async () => ({ size: DEFAULT_MODEL.size }) });
  expect(await localModelsPresent()).toBe(false);
  match.mockImplementation(async (key: string) => {
    const url = new URL(key);
    const model = [DEFAULT_SPEECH_MODEL, needleModel(12)].find(
      (m) => m.url === url.origin + url.pathname,
    )!;
    expect(url.searchParams.get('__needle_sha256')).toBe(model.sha256);
    return { blob: async () => ({ size: model.size }) };
  });
  expect(await localModelsPresent()).toBe(true);
});
test('both Whistle and the selected Needle depth are required; other depths do not count', async () => {
  const entries = new Map<string, number>();
  const add = (model: { url: string; sha256: string; size: number }) => {
    const key = new URL(model.url);
    key.searchParams.set('__needle_sha256', model.sha256);
    entries.set(key.href, model.size);
  };
  vi.stubGlobal('caches', {
    has: async () => true,
    open: async () => ({
      match: async (key: string) =>
        entries.has(key) ? { blob: async () => ({ size: entries.get(key) }) } : undefined,
    }),
  });
  add(DEFAULT_MODEL);
  expect(await localModelsPresent()).toBe(false);
  entries.clear();
  add(DEFAULT_SPEECH_MODEL);
  expect(await localModelsPresent()).toBe(false);
  add(DEFAULT_MODEL);
  expect(await localModelsPresent(20)).toBe(true);
  expect(await localModelsPresent(12)).toBe(false);
  add(needleModel(12));
  expect(await localModelsPresent(12)).toBe(true);
  expect(await localModelsPresent(4)).toBe(false);
});
test('explicit microphone check requests audio and immediately releases every track', async () => {
  const stop = vi.fn();
  const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop }, { stop }] }));
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('AudioContext', class {});
  vi.stubGlobal('AudioWorkletNode', class {});
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  await checkMicrophone();
  expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ video: false }));
  expect(stop).toHaveBeenCalledTimes(2);
});
test('reports unavailable browser features and propagates a denied permission', async () => {
  vi.stubGlobal('isSecureContext', false);
  expect(microphoneProblem()).toContain('HTTPS');
  await expect(checkMicrophone()).rejects.toThrow('HTTPS');
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('navigator', {});
  expect(microphoneProblem()).toContain('Firefox');
  const denied = new DOMException('Permission denied', 'NotAllowedError');
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn(async () => {
        throw denied;
      }),
    },
  });
  vi.stubGlobal('AudioContext', class {});
  vi.stubGlobal('AudioWorkletNode', class {});
  await expect(checkMicrophone()).rejects.toBe(denied);
});
