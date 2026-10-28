import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./platform', () => ({ nativeBundle: true }));
import { microphoneProblem } from '../voice/readiness';

afterEach(() => vi.unstubAllGlobals());
it('probes native APIs without requiring a browser HTTPS flag or requesting the microphone', () => {
  const getUserMedia = vi.fn();
  vi.stubGlobal('isSecureContext', false);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.stubGlobal('AudioContext', class {});
  vi.stubGlobal('AudioWorkletNode', class {});
  expect(microphoneProblem()).toBe('');
  expect(getUserMedia).not.toHaveBeenCalled();
  vi.stubGlobal('AudioWorkletNode', undefined);
  expect(microphoneProblem()).toContain('entrada manual');
  expect(microphoneProblem()).not.toContain('Tailscale');
});
