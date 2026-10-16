import { useEffect, useRef, useState } from 'react';
import { Check, Download, Mic } from 'lucide-react';
import { languages, tr, type Language } from '../i18n';
import { chooseVoiceLanguage, prepareVoice, refreshVoiceFiles, useVoiceSetup } from '../voice/setup';
import { checkMicrophone, microphoneProblem } from '../voice/readiness';
import { voiceError } from '../voice/engine';
import { ErrorMessage } from './ui';
export function VoicePreparation({live=false}:{live?:boolean}) {
 const setup=useVoiceSetup(),[mic,setMic]=useState<'idle'|'asking'|'ok'>('idle'),[error,setError]=useState('');
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;void refreshVoiceFiles();return()=>{alive.current=false;};},[]);
 const problem=microphoneProblem(), missing=['missing','error'].includes(setup.phase);
 const testMic=async()=>{
  if(mic==='asking')return;setMic('asking');setError('');
  try{await checkMicrophone();if(alive.current)setMic('ok');}
  catch(e){if(alive.current){setMic('idle');setError(voiceError(e));}}
 };
 return <section className="voice-preparation" aria-label={tr('Preparación de voz')}>
  <div className="section-heading"><h2>{tr('Prepara la voz antes del partido')}</h2>{setup.phase==='ready'&&<span className="badge live"><Check size={12}/> {tr('Cactus listo')}</span>}</div>
  {missing&&<p role="alert" className="preparation-alert">{tr('Cactus no está cargado en este navegador. Elige el idioma y carga los modelos antes de iniciar el partido.')}</p>}
  {setup.phase==='cached'&&<p className="caption">{tr('Los modelos están en local. Cárgalos antes del partido.')}</p>}
  <label>{tr('Idioma de voz')}<select aria-label={tr('Idioma de voz')} value={setup.languageChosen?setup.language:''} disabled={setup.phase==='loading'||live} onChange={e=>void chooseVoiceLanguage(e.target.value as Language)}><option value="" disabled>{tr('Elige el idioma de voz')}</option>{Object.entries(languages).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>
  {setup.phase==='loading'?<p role="status">{tr('Cargando modelos…')} {setup.progress}</p>:setup.phase!=='ready'&&<button type="button" className="primary" disabled={!setup.languageChosen||setup.phase==='checking'||Boolean(problem)||live} onClick={()=>void prepareVoice(true)}><Download size={16}/>{tr('Cargar Cactus · 53 MB')}</button>}
  <button type="button" disabled={mic==='asking'||Boolean(problem)} onClick={()=>void testMic()}><Mic size={16}/>{tr(mic==='asking'?'Solicitando permiso…':mic==='ok'?'Micrófono comprobado':'Comprobar micrófono')}</button>
  {mic==='ok'&&<p className="caption" role="status">{tr('Permiso concedido. El micrófono se ha cerrado; solo se abrirá mientras mantengas pulsado para hablar.')}</p>}
  {problem&&<p role="alert" className="error">{tr(problem)}</p>}
  <ErrorMessage text={error||setup.error}/>
  <p className="caption">{tr('La descarga necesita conexión una vez. La voz funciona con los modelos locales; mantén pulsado para hablar y suelta para terminar.')}</p>
 </section>;
}
