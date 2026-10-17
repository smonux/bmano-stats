import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { lockPortrait } from './orientation';

const lock = vi.fn();
const enter = vi.fn();
const exit = vi.fn();
let fullscreen = false;
beforeEach(() => {
  vi.resetAllMocks();
  fullscreen = false;
  lock.mockResolvedValue(undefined);
  enter.mockImplementation(async () => {
    fullscreen = true;
  });
  exit.mockImplementation(async () => {
    fullscreen = false;
  });
  vi.stubGlobal('screen', { orientation: { lock } });
  vi.stubGlobal('document', {
    get fullscreenElement() {
      return fullscreen ? {} : null;
    },
    documentElement: { requestFullscreen: enter },
    exitFullscreen: exit,
  });
});
afterEach(() => vi.unstubAllGlobals());

test('automatic portrait attempts do not open fullscreen', async () => {
  expect(await lockPortrait()).toBe(true);
  expect(lock).toHaveBeenCalledWith('portrait');
  expect(enter).not.toHaveBeenCalled();
});
test('the explicit action enters fullscreen before locking', async () => {
  lock.mockImplementation(async () => {
    expect(fullscreen).toBe(true);
  });
  expect(await lockPortrait(true)).toBe(true);
  expect(enter).toHaveBeenCalledOnce();
  expect(exit).not.toHaveBeenCalled();
});
test('failed locks restore fullscreen entered by the action', async () => {
  lock.mockRejectedValue(new Error('unsupported'));
  expect(await lockPortrait(true)).toBe(false);
  expect(exit).toHaveBeenCalledOnce();
  expect(fullscreen).toBe(false);
});
test('a failed lock leaves an existing fullscreen session intact', async () => {
  fullscreen = true;
  lock.mockRejectedValue(new Error('unsupported'));
  expect(await lockPortrait(true)).toBe(false);
  expect(enter).not.toHaveBeenCalled();
  expect(exit).not.toHaveBeenCalled();
});
test('unsupported browsers do not enter fullscreen', async () => {
  vi.stubGlobal('screen', {});
  expect(await lockPortrait(true)).toBe(false);
  expect(enter).not.toHaveBeenCalled();
});
