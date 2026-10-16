import { createNeedle, createWhistle } from 'cactus-needle/browser';
import { schemaForTeams, selectProposal, perspectiveRule } from './interpretation';
type NeedleSession = Awaited<ReturnType<typeof createNeedle>>;
type WhistleSession = Awaited<ReturnType<typeof createWhistle>>;

/** Owned by one capture panel. Closing it terminates workers and active inference. */
export class VoiceEngine {
  private needle?: NeedleSession;
  private whistle?: WhistleSession;
  private controller = new AbortController();
  get ready() { return Boolean(this.needle && this.whistle); }
  async prepare(progress: (text: string) => void) {
    if(this.ready) return;
    const options = (name: string) => ({offline:!navigator.onLine,abortSignal:this.controller.signal,onDownloadProgress:({percentage,loaded}:{percentage?:number;loaded:number})=>progress(`${name}: ${percentage!==undefined?Math.round(percentage)+' %':(loaded/1e6).toFixed(1)+' MB'}`)});
    try {
      progress('Cargando Whistle…'); this.whistle=await createWhistle(options('Whistle'));
      progress('Cargando Needle…'); this.needle=await createNeedle({...options('Needle'),stateless:true,system:'Extrae una única jugada de balonmano en español. No ejecutes acciones. No inventes datos que no se mencionan. '+perspectiveRule,maxOutputTokens:512});
      progress('Modelos listos en este dispositivo.');
    } catch(error) {await this.close(); throw error;}
  }
  async transcribe(samples: Float32Array, sampleRate: number, keywords: string[]) {
    if(!this.whistle) throw new Error('Prepara los modelos antes de grabar.');
    return this.whistle.transcribe({samples,sampleRate},{language:'es',keywords,abortSignal:this.controller.signal});
  }
  async interpret(text: string, teams: string[]) {
    if(!this.needle) throw new Error('Needle no está disponible.');
    const result=await this.needle.complete(text,{tools:{registrar_jugada:{description:'Registrar una sola jugada de balonmano. Copiar exclusivamente datos mencionados.',inputSchema:schemaForTeams(teams)}},abortSignal:this.controller.signal});
    return selectProposal(result);
  }
  async close() {
    this.controller.abort();
    const sessions=[this.whistle,this.needle]; this.whistle=undefined;this.needle=undefined;
    await Promise.allSettled(sessions.map(session=>session?.close()));
  }
}
export function voiceError(error: unknown, loading = false) {
  if(error instanceof DOMException && error.name==='NotAllowedError') return 'No hay permiso para el micrófono. Permítelo en los ajustes del navegador y vuelve a intentarlo.';
  if(error instanceof DOMException && error.name==='NotFoundError') return 'No se encontró un micrófono. Conecta uno o usa la entrada manual.';
  if(error instanceof DOMException && error.name==='NotReadableError') return 'El micrófono está ocupado o no se puede abrir.';
  if(loading && !navigator.onLine) return 'No se pudieron cargar los modelos sin conexión. Prepáralos una vez con conexión en este navegador.';
  return error instanceof Error ? `No se pudo procesar la voz: ${error.message}` : 'No se pudo procesar la voz. Puedes usar la entrada manual.';
}
