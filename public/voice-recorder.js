// Capture mono PCM in bounded chunks. No audio is played or sent over the network.
class HandballRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.offset = 0;
    this.active = true;
    this.port.onmessage = ({ data }) => {
      if (data === 'stop') {
        this.active = false;
        this.flush();
        this.port.postMessage({ done: true });
      }
    };
  }
  flush() {
    if (this.offset) {
      const chunk = this.buffer.slice(0, this.offset);
      this.port.postMessage({ samples: chunk }, [chunk.buffer]);
      this.offset = 0;
    }
  }
  process(inputs) {
    if (!this.active) {
      return false;
    }
    const channels = inputs[0];
    if (!channels?.length) {
      return true;
    }
    for (let i = 0; i < channels[0].length; i++) {
      let sample = 0;
      for (const channel of channels) {
        sample += channel[i] / channels.length;
      }
      this.buffer[this.offset++] = Number.isFinite(sample) ? Math.max(-1, Math.min(1, sample)) : 0;
      if (this.offset === this.buffer.length) {
        this.flush();
      }
    }
    return true;
  }
}
registerProcessor('handball-recorder', HandballRecorder);
