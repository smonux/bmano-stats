import { tr, type Language } from '../i18n';
import { createNeedle, createWhistle } from 'cactus-needle/browser';
import { selectProposal } from './interpretation';
import { captureFacts, toolForPlay } from './routing';
type NeedleSession = Awaited<ReturnType<typeof createNeedle>>;
type WhistleSession = Awaited<ReturnType<typeof createWhistle>>;

/** Reused from pre-match preparation. Closing cancels workers and active inference. */
export class VoiceEngine {
  constructor(private language: Language = 'es') {}
  private needle?: NeedleSession;
  private whistle?: WhistleSession;
  private controller = new AbortController();
  get ready() { return Boolean(this.needle && this.whistle); }
  async prepare(progress: (text: string) => void, offline = !navigator.onLine) {
    if(this.ready) return;
    const options = (name: string) => ({offline,abortSignal:this.controller.signal,onDownloadProgress:({percentage,loaded}:{percentage?:number;loaded:number})=>progress(`${name}: ${percentage!==undefined?Math.round(percentage)+' %':(loaded/1e6).toFixed(1)+' MB'}`)});
    try {
      progress(tr('Cargando Whistle…')); this.whistle=await createWhistle(options('Whistle'));
      progress(tr('Cargando Needle…')); this.needle=await createNeedle({...options('Needle'),stateless:true,system:captureFacts(this.language),maxOutputTokens:192});
      progress(tr('Modelos listos en este dispositivo.'));
    } catch(error) {await this.close(); throw error;}
  }
  async transcribe(samples: Float32Array, sampleRate: number, keywords: string[]) {
    if(!this.whistle) throw new Error('Prepara los modelos antes de grabar.');
    return this.whistle.transcribe({samples,sampleRate},{language:this.language,keywords,abortSignal:this.controller.signal});
  }
  async interpret(text: string, teams: string[]) {
    if(!this.needle) throw new Error('Needle no está disponible.');
    const route=toolForPlay(text,this.language,teams),start=performance.now();
    const result=await this.needle.complete(route.text,{tools:route.tools,maxNewTokens:route.type?128:192,abortSignal:this.controller.signal});
    const calls=(items:typeof result.function_calls)=>items.map(call=>route.type&&call.name===route.name?{...call,name:'registrar_jugada',arguments:{...call.arguments,evento:route.name,...(route.teamReference?{equipo:route.teamReference}:{})}}:call);
    return {...selectProposal({...result,function_calls:calls(result.function_calls),suppressed_calls:calls(result.suppressed_calls)}),timing:{elapsedMs:performance.now()-start,prefillTps:result.prefill_tps,decodeTps:result.decode_tps,schemaCharacters:route.schemaCharacters,route:route.type??'general'}};
  }

  async close() {
    this.controller.abort();
    const sessions=[this.whistle,this.needle]; this.whistle=undefined;this.needle=undefined;
    await Promise.allSettled(sessions.map(session=>session?.close()));
  }
}
export function voiceError(error: unknown, loading = false) {
  if(error instanceof DOMException && error.name==='NotAllowedError') return 'No hay permiso para el micrófono. Revisa los permisos de este sitio y los permisos de micrófono del navegador en el dispositivo. Vuelve a intentarlo.';
  if(error instanceof DOMException && error.name==='NotFoundError') return 'No se encontró un micrófono. Conecta uno o usa la entrada manual.';
  if(error instanceof DOMException && error.name==='NotReadableError') return 'El micrófono está ocupado o no se puede abrir.';
  if(loading && !navigator.onLine) return 'No se pudieron cargar los modelos sin conexión. Prepáralos una vez con conexión en este navegador.';
  return error instanceof Error ? tr('No se pudo procesar la voz: {reason}',{reason:tr(error.message)}) : 'No se pudo procesar la voz. Puedes usar la entrada manual.';
}
