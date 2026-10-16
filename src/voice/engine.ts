import { tr, type Language } from '../i18n';
import { createNeedle, createWhistle } from 'cactus-needle/browser';
import { schemaForTeams, selectProposal, perspectiveFor } from './interpretation';
type NeedleSession = Awaited<ReturnType<typeof createNeedle>>;
type WhistleSession = Awaited<ReturnType<typeof createWhistle>>;

/** Owned by one capture panel. Closing it terminates workers and active inference. */
export class VoiceEngine {
  constructor(private language: Language = 'es') {}
  private needle?: NeedleSession;
  private whistle?: WhistleSession;
  private controller = new AbortController();
  get ready() { return Boolean(this.needle && this.whistle); }
  async prepare(progress: (text: string) => void) {
    if(this.ready) return;
    const options = (name: string) => ({offline:!navigator.onLine,abortSignal:this.controller.signal,onDownloadProgress:({percentage,loaded}:{percentage?:number;loaded:number})=>progress(`${name}: ${percentage!==undefined?Math.round(percentage)+' %':(loaded/1e6).toFixed(1)+' MB'}`)});
    try {
      progress(tr('Cargando Whistle…')); this.whistle=await createWhistle(options('Whistle'));
      progress(tr('Cargando Needle…')); this.needle=await createNeedle({...options('Needle'),stateless:true,system:`Extract one handball action spoken in ${this.language}. Return only the tool schema's canonical values, preserving literal player names. Never execute actions or invent unmentioned facts. `+perspectiveFor(this.language),maxOutputTokens:256});
      progress(tr('Modelos listos en este dispositivo.'));
    } catch(error) {await this.close(); throw error;}
  }
  async transcribe(samples: Float32Array, sampleRate: number, keywords: string[]) {
    if(!this.whistle) throw new Error('Prepara los modelos antes de grabar.');
    return this.whistle.transcribe({samples,sampleRate},{language:this.language,keywords,abortSignal:this.controller.signal});
  }
  async interpret(text: string, teams: string[]) {
    if(!this.needle) throw new Error('Needle no está disponible.');
    const result=await this.needle.complete(text,{tools:{registrar_jugada:{description:'Extract a single handball play from the recording language. Copy only explicitly mentioned facts.',inputSchema:schemaForTeams(teams,this.language)}},abortSignal:this.controller.signal});
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
  return error instanceof Error ? tr('No se pudo procesar la voz: {reason}',{reason:tr(error.message)}) : 'No se pudo procesar la voz. Puedes usar la entrada manual.';
}
