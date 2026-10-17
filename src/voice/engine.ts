import { tr, type Language } from '../i18n';
import { createWhistle } from 'cactus-needle/browser';
import { interpretDeterministically, type RulePlayer } from './deterministic';
type WhistleSession = Awaited<ReturnType<typeof createWhistle>>;

/** Reused from pre-match preparation. Closing cancels workers and active inference. */
export class VoiceEngine {
  constructor(private language: Language = 'es') {}
  private whistle?: WhistleSession;
  private controller = new AbortController();
  get ready() { return Boolean(this.whistle); }
  async prepare(progress: (text: string) => void, offline = !navigator.onLine) {
    if(this.ready) return;
    const options = (name: string) => ({offline,abortSignal:this.controller.signal,onDownloadProgress:({percentage,loaded}:{percentage?:number;loaded:number})=>progress(`${name}: ${percentage!==undefined?Math.round(percentage)+' %':(loaded/1e6).toFixed(1)+' MB'}`)});
    try {
      progress(tr('Cargando Whistle…')); this.whistle=await createWhistle(options('Whistle'));
      progress(tr('Modelos listos en este dispositivo.'));
    } catch(error) {await this.close(); throw error;}
  }
  async transcribe(samples: Float32Array, sampleRate: number, keywords: string[]) {
    if(!this.whistle) throw new Error('Prepara los modelos antes de grabar.');
    return this.whistle.transcribe({samples,sampleRate},{language:this.language,keywords,abortSignal:this.controller.signal});
  }
  async interpret(text: string, teams: string[], players:RulePlayer[] = []) {
    const start=performance.now();
    const result=interpretDeterministically(text,this.language,teams,players);
    return {...result,timing:{elapsedMs:performance.now()-start,method:'deterministic' as const}};
  }

  async close() {
    this.controller.abort();
    const sessions=[this.whistle]; this.whistle=undefined;
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
