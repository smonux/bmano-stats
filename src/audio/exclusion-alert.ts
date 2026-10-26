const ALERT_SECONDS = 5;
const BEAT_SECONDS = 60 / 108;
const NOTE_GAP_SECONDS = 0.025;
const PITCH_HZ = {
  A4: 440,
  D5: 440 * 2 ** (5 / 12),
  E5: 440 * 2 ** (7 / 12),
  'F#5': 440 * 2 ** (9 / 12),
  G5: 440 * 2 ** (10 / 12),
} as const;

// Oudrid, El sitio de Zaragoza: opening three bars of the jota theme marked A.
// Melody only; our own synthesized rendition, with nine quarter-note beats at 108 BPM.
// Score: https://www.el-atril.com/partituras/varios/El%20sitio%20de%20Zaragoza.pdf, p. 4.
const JOTA_PHRASE = [
  { pitch: 'A4', beats: 1 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'E5', beats: 1 },
  { pitch: 'F#5', beats: 1 },
  { pitch: 'F#5', beats: 0.5 },
  { pitch: 'G5', beats: 0.5 },
  { pitch: 'F#5', beats: 0.5 },
  { pitch: 'G5', beats: 0.5 },
  { pitch: 'F#5', beats: 1 },
  { pitch: 'E5', beats: 1 },
  { pitch: 'D5', beats: 1 },
] as const;

/** A five-second jota excerpt; simultaneous expiries share the same alert. */
export class ExclusionAlert {
  private context: AudioContext | null = null;
  private playingUntil = 0;
  private notes = new Set<OscillatorNode>();

  constructor(private createContext: () => AudioContext = () => new AudioContext()) {}

  /** Browsers require this call to originate from a user gesture. */
  async prepare() {
    const context = (this.context ??= this.createContext());
    if (context.state !== 'running') {
      await context.resume();
    }
    if (context.state !== 'running') {
      throw new Error('Audio is suspended');
    }
  }

  play(): boolean {
    const context = this.context;
    if (!context || context.state !== 'running') {
      return false;
    }
    if (context.currentTime < this.playingUntil) {
      return true;
    }
    const start = context.currentTime;
    const end = start + ALERT_SECONDS;
    this.playingUntil = end;
    let beat = 0;
    for (const [index, note] of JOTA_PHRASE.entries()) {
      const noteStart = start + beat * BEAT_SECONDS;
      beat += note.beats;
      const noteEnd =
        index === JOTA_PHRASE.length - 1 ? end : start + beat * BEAT_SECONDS - NOTE_GAP_SECONDS;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = PITCH_HZ[note.pitch];
      volume.gain.setValueAtTime(0, noteStart);
      volume.gain.linearRampToValueAtTime(0.16, noteStart + 0.01);
      volume.gain.exponentialRampToValueAtTime(0.001, noteEnd);
      oscillator.connect(volume);
      volume.connect(context.destination);
      this.notes.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        volume.disconnect();
        this.notes.delete(oscillator);
      };
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    }
    return true;
  }

  silence() {
    for (const oscillator of this.notes) {
      oscillator.stop();
    }
    this.notes.clear();
    this.playingUntil = 0;
  }

  async close() {
    this.silence();
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') {
      await context.close();
    }
  }
}
