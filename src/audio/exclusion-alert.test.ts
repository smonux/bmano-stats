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

  it('plays the opening jota melody with its quarter/eighth rhythm over five seconds', async () => {
    const audio = fakeAudio();
    const alert = new ExclusionAlert(audio.createContext);
    await alert.prepare();
    alert.play();
    const frequencies = [
      440, 587.33, 659.26, 739.99, 739.99, 783.99, 739.99, 783.99, 739.99, 659.26, 587.33,
    ];
    const beats = [0, 1, 2, 3, 4, 4.5, 5, 5.5, 6, 7, 8];
    expect(audio.notes).toHaveLength(11);
    for (const [index, note] of audio.notes.entries()) {
      expect(note.type).toBe('triangle');
      expect(note.frequency.value).toBeCloseTo(frequencies[index], 2);
      expect(note.start.mock.calls[0][0]).toBeCloseTo(12 + beats[index] * (5 / 9));
      const end = note.stop.mock.calls[0][0];
      expect(end).toBeGreaterThan(note.start.mock.calls[0][0] + 0.01);
      if (index < audio.notes.length - 1) {
        expect(end).toBeCloseTo(12 + beats[index + 1] * (5 / 9) - 0.025);
      } else {
        expect(end).toBe(17);
      }
    }
    for (const volume of audio.volumes) {
      expect(volume.gain.setValueAtTime.mock.calls[0][0]).toBe(0);
      expect(volume.gain.linearRampToValueAtTime.mock.calls[0][0]).toBe(0.16);
      expect(volume.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBe(0.001);
    }
  });

  it('shares an ongoing alert across simultaneous expiries and can alert again later', async () => {
    const audio = fakeAudio();
    const alert = new ExclusionAlert(audio.createContext);
    await alert.prepare();
    alert.play();
    expect(alert.play()).toBe(true);
    expect(audio.notes).toHaveLength(11);
    audio.context.currentTime += 6;
    alert.play();
    expect(audio.notes).toHaveLength(22);
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
    expect(audio.notes).toHaveLength(22);
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
