import { microphoneProblem } from './readiness';
export type Recording = {samples:Float32Array;sampleRate:number};
export class VoiceRecorder {
  private stream?:MediaStream;
  private context?:AudioContext;
  private node?:AudioWorkletNode;
  private source?:MediaStreamAudioSourceNode;
  private chunks:Float32Array[]=[];
  private count=0;
  private cancelled=false;
  private stopping?:Promise<Recording>;
  private done?:()=>void;
  private timer?:ReturnType<typeof setTimeout>;
  async start(limit:()=>void) {
    const problem=microphoneProblem();if(problem)throw new Error(problem);
    // Construct/resume in the user gesture for Safari and mobile autoplay policies.
    this.context=new AudioContext();
    const resume=this.context.resume();
    try {
      this.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
      if(this.cancelled) {this.release(); return false;}
      await resume;
      await this.context.audioWorklet.addModule('/voice-recorder.js');
      if(this.cancelled) {this.release(); return false;}
      const rate=this.context.sampleRate;
      this.source=this.context.createMediaStreamSource(this.stream);
      this.node=new AudioWorkletNode(this.context,'handball-recorder');
      this.node.port.onmessage=({data})=>{
        if(data.samples) {const remaining=Math.max(0,Math.floor(rate*20)-this.count);const chunk=(data.samples as Float32Array).slice(0,remaining);this.chunks.push(chunk);this.count+=chunk.length;}
        if(data.done) this.done?.();
      };
      this.source.connect(this.node); this.node.connect(this.context.destination);
      this.timer=setTimeout(limit,20000);
      return true;
    } catch(error) {this.release();throw error;}
  }
  stop():Promise<Recording> {
    if(this.stopping) return this.stopping;
    this.stopping=(async()=>{
      if(!this.node||!this.context) throw new Error('La grabación no ha comenzado.');
      clearTimeout(this.timer);
      const sampleRate=this.context.sampleRate;
      await new Promise<void>(resolve=>{const timer=setTimeout(resolve,500);this.done=()=>{clearTimeout(timer);resolve();};this.node!.port.postMessage('stop');});
      this.release();
      const samples=new Float32Array(this.count); let offset=0;
      for(const chunk of this.chunks) {samples.set(chunk,offset);offset+=chunk.length;}
      this.chunks=[];return {samples,sampleRate};
    })();return this.stopping;
  }
  cancel() {this.cancelled=true;this.done?.();this.release();this.chunks=[];this.count=0;}
  private release() {
    clearTimeout(this.timer); this.stream?.getTracks().forEach(t=>t.stop());
    this.node?.disconnect();this.source?.disconnect();
    if(this.context && this.context.state!=='closed') void this.context.close().catch(()=>{});
  }
}
