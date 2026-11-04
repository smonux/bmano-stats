import { describe, expect, it, vi } from 'vitest';
import { ExclusionAlert } from './exclusion-alert';

function fakeAudio() {
  const makeNote = () => ({
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  });
  const makeVolume = () => ({
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  const notes: ReturnType<typeof makeNote>[] = [];
  const volumes: ReturnType<typeof makeVolume>[] = [];
  const context = {
    state: 'suspended',
    currentTime: 12,
    destination: {},
    resume: vi.fn(async () => {
      context.state = 'running';
    }),
    close: vi.fn(async () => {
      context.state = 'closed';
    }),
    createOscillator: vi.fn(() => {
      const note = makeNote();
      notes.push(note);
      return note;
    }),
    createGain: vi.fn(() => {
      const volume = makeVolume();
      volumes.push(volume);
      return volume;
    }),
  };
  const createContext = vi.fn(() => context as unknown as AudioContext);
  return { context, createContext, notes, volumes };
}

describe('exclusion expiry sound', () => {
  it('requires preparation from a gesture before it can play', async () => {
    const audio = fakeAudio();
    const alert = new ExclusionAlert(audio.createContext);
    expect(alert.play()).toBe(false);
    expect(audio.createContext).not.toHaveBeenCalled();
    await alert.prepare();
    expect(audio.context.resume).toHaveBeenCalledOnce();
    await alert.prepare();
    expect(audio.context.resume).toHaveBeenCalledOnce();
    expect(alert.play()).toBe(true);
  });

  it('plays three descending ding-dong pairs with a gentle decay over five seconds', async () => {
    const audio = fakeAudio();
    const alert = new ExclusionAlert(audio.createContext);
    await alert.prepare();
    alert.play();
    expect(audio.notes).toHaveLength(6);
    const offsets = [0, 0.65, 1.8, 2.45, 3.6, 4.25];
    for (const [index, note] of audio.notes.entries()) {
      expect(note.type).toBe('sine');
      expect(note.frequency.value).toBe(index % 2 === 0 ? 660 : 523.25);
      expect(note.start.mock.calls[0][0]).toBeCloseTo(12 + offsets[index]);
      expect(note.stop.mock.calls[0][0]).toBeGreaterThan(note.start.mock.calls[0][0]);
      expect(note.stop.mock.calls[0][0]).toBeLessThanOrEqual(17);
    }
    expect(audio.notes.at(-1)!.stop).toHaveBeenCalledWith(17);
    for (const volume of audio.volumes) {
      expect(volume.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
      expect(volume.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.16, expect.any(Number));
      expect(volume.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        0.001,
        expect.any(Number),
      );
    }
  });

  it('shares an ongoing alert across simultaneous expiries and can alert again later', async () => {
    const audio = fakeAudio();
    const alert = new ExclusionAlert(audio.createContext);
    await alert.prepare();
    alert.play();
    expect(alert.play()).toBe(true);
    expect(audio.notes).toHaveLength(6);
    audio.context.currentTime += 6;
    alert.play();
    expect(audio.notes).toHaveLength(12);
  });

  it('silences scheduled notes immediately, disconnects them and releases the audio context', async () => {
    const audio = fakeAudio();
    const alert = new ExclusionAlert(audio.createContext);
    await alert.prepare();
    alert.play();
    alert.silence();
    for (const note of audio.notes) {
      expect(note.stop).toHaveBeenLastCalledWith();
      note.onended?.();
      expect(note.disconnect).toHaveBeenCalledOnce();
    }
    expect(audio.volumes.every((volume) => volume.disconnect.mock.calls.length === 1)).toBe(true);
    // Muting must cancel even the notes that have not started yet; unmuting can replay.
    expect(alert.play()).toBe(true);
    expect(audio.notes).toHaveLength(12);
    await alert.close();
    await alert.close();
    expect(audio.context.close).toHaveBeenCalledOnce();
    expect(alert.play()).toBe(false);
  });

  it('does not pretend to play when the browser leaves the audio suspended', async () => {
    const audio = fakeAudio();
    audio.context.resume.mockImplementation(async () => {});
    const alert = new ExclusionAlert(audio.createContext);
    await expect(alert.prepare()).rejects.toThrow('Audio is suspended');
    expect(alert.play()).toBe(false);
    expect(audio.notes).toHaveLength(0);
  });
});
