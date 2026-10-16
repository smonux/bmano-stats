import { useSyncExternalStore } from 'react';
import { getLanguage, type Language } from '../i18n';
import { savedVoiceLanguage } from '../i18n/voice';
import { VoiceEngine, voiceError } from './engine';
import { localModelsPresent } from './readiness';
import { savedNeedleDepth, type NeedleDepth } from './models';

type Phase = 'checking'|'missing'|'cached'|'loading'|'ready'|'error';
type State = {phase:Phase;language:Language;languageChosen:boolean;needleDepth:NeedleDepth;progress:string;error:string};
const chosen=()=>{try{return localStorage.getItem('handball-voice-language')!==null;}catch{return false;}};
let state:State={phase:'checking',language:savedVoiceLanguage(),languageChosen:chosen(),needleDepth:savedNeedleDepth(),progress:'',error:''};
const listeners=new Set<()=>void>();
let engine:VoiceEngine|undefined, pending:Promise<boolean>|undefined;
const update=(change:Partial<State>)=>{state={...state,...change};listeners.forEach(fn=>fn());};
export const useVoiceSetup=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>state);
export const voiceState=()=>state;
export async function refreshVoiceFiles() {
  if(['loading','ready'].includes(state.phase))return;
  const depth=state.needleDepth;
  try{const present=await localModelsPresent(depth);if(depth!==state.needleDepth||['loading','ready'].includes(state.phase))return;update({phase:present?'cached':'missing',error:''});}
  catch{if(depth===state.needleDepth)update({phase:'missing',error:''});}
}
export async function chooseNeedleDepth(needleDepth:NeedleDepth) {
  if(state.phase==='loading'||state.needleDepth===needleDepth)return;
  const current=engine;engine=undefined;
  try{localStorage.setItem('handball-needle-depth',String(needleDepth));}catch{}
  update({needleDepth,phase:'checking',progress:'',error:''});
  if(current)await current.close();
  await refreshVoiceFiles();
}
export async function chooseVoiceLanguage(language:Language) {
  if(state.phase==='loading')return;
  await discardVoiceEngine();
  try{localStorage.setItem('handball-voice-language',language);}catch{}
  update({language,languageChosen:true,error:''});
}
export async function discardVoiceEngine() {
  const current=engine;engine=undefined;
  if(current)await current.close();
  update({phase:'checking'});await refreshVoiceFiles();
}
/** Download only in preparation. A live match may load existing local files, never fetch models. */
export function prepareVoice(download:boolean):Promise<boolean> {
  if(pending)return pending;
  if(engine?.ready)return Promise.resolve(true);
  const language=state.languageChosen?state.language:getLanguage();
  pending=(async()=>{
    if(!state.languageChosen){update({phase:'error',error:'Elige el idioma de voz antes de cargar Cactus.'});return false;}
    const current=new VoiceEngine(language,state.needleDepth);engine=current;
    update({phase:'loading',progress:'',error:''});
    try {
      await current.prepare(progress=>update({progress}),!download);
      if(!await localModelsPresent(state.needleDepth))throw new Error('Los modelos no se han guardado en este navegador. Libera espacio y vuelve a cargarlos antes del partido.');
      update({phase:'ready',error:''});return true;
    }catch(error){await current.close();engine=undefined;update({phase:'error',error:voiceError(error,true)});return false;}
  })().finally(()=>{pending=undefined;});
  return pending;
}
export function preparedEngine() {
  if(!engine?.ready)throw new Error('Prepara los modelos antes de grabar.');
  return engine;
}
