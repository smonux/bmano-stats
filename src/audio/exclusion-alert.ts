const ALERT_SECONDS = 5;
const NOTE_SECONDS = 2;
const CHIMES = [
  { offset: 0, frequency: 880 },
  { offset: 0.6, frequency: 660 },
  { offset: 2.4, frequency: 880 },
  { offset: 3, frequency: 660 },
] as const;

/** A five-second din-don, din-don; simultaneous expiries share the same alert. */
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
    for (const chime of CHIMES) {
      const noteStart = start + chime.offset;
      const noteEnd = Math.min(noteStart + NOTE_SECONDS, end);
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = chime.frequency;
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
