import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('cactus-needle/browser', () => ({
  DEFAULT_SPEECH_MODEL: {
    size: 3,
    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
}));
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());
it('verifies the real body once, independently of cache flags or Content-Length', async () => {
  const fetch = vi.fn(
    async (_input: RequestInfo | URL) =>
      new Response('abc', { headers: { 'Content-Length': '999' } }),
  );
  vi.stubGlobal('fetch', fetch);
  const { bundledWhistle } = await import('./whistle');
  expect(new TextDecoder().decode(await bundledWhistle())).toBe('abc');
  await bundledWhistle();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe('/models/whistle.cact');
});
it('rejects absent, truncated and same-size corrupt assets; failure can be retried', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 404 }))
    .mockResolvedValueOnce(new Response('ab'))
    .mockResolvedValueOnce(new Response('abd'))
    .mockResolvedValueOnce(new Response('abc'));
  vi.stubGlobal('fetch', fetch);
  const { bundledWhistle } = await import('./whistle');
  await expect(bundledWhistle()).rejects.toThrow('no están disponibles');
  await expect(bundledWhistle()).rejects.toThrow('dañados');
  await expect(bundledWhistle()).rejects.toThrow('dañados');
  await expect(bundledWhistle()).resolves.toHaveLength(3);
});
