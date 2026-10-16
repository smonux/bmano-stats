import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import type { Match, Snapshot } from '../domain/model';
import { tr } from '../i18n';
import { voiceKeywords } from '../i18n/voice';
import { voiceError } from '../voice/engine';
import { VoiceRecorder } from '../voice/recorder';
import { microphoneProblem } from '../voice/readiness';
import { useVoiceSetup, prepareVoice, preparedEngine, discardVoiceEngine } from '../voice/setup';
import { captureContext, toVoiceDraft, type CaptureContext } from '../voice/interpretation';
import { EventEditor } from './EventEditor';
import { ErrorMessage } from './ui';
type Phase='ready'|'permission'|'recording'|'transcribing'|'interpreting'|'review';
type Result=ReturnType<typeof toVoiceDraft>;
export function VoiceCapture({match,data,allowReview}:{match:Match;data:Snapshot;allowReview:boolean}) {
 const setup=useVoiceSetup();
 const [phase,setPhase]=useState<Phase>('ready'),[status,setStatus]=useState(''),[error,setError]=useState('');
 const [result,setResult]=useState<Result|null>(null),[seconds,setSeconds]=useState(0);
 const recorder=useRef<VoiceRecorder|null>(null),alive=useRef(true),lock=useRef(false),held=useRef(false),processing=useRef(false);
 const timings=useRef({whistleMs:0,needleMs:0});
 const capture=useRef<CaptureContext|null>(null),stopRef=useRef<()=>void>(()=>{});
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;recorder.current?.cancel();if(processing.current)void discardVoiceEngine();};},[]);
 useEffect(()=>{if(setup.phase==='cached')void prepareVoice(false);},[setup.phase]);
 useEffect(()=>{if(phase!=='recording')return;const start=Date.now();const timer=setInterval(()=>setSeconds(Math.min(20,Math.floor((Date.now()-start)/1000))),200);return()=>clearInterval(timer);},[phase]);
 const stop=async()=>{
  if(!recorder.current||lock.current)return;
  lock.current=true;processing.current=true;setPhase('transcribing');setStatus(tr('Whistle está transcribiendo…'));
  try {
   const audio=await recorder.current.stop();recorder.current=null;if(!alive.current)return;
   if(audio.samples.length<audio.sampleRate*.25)throw new Error(tr('La grabación es demasiado corta. Mantén pulsado hasta terminar la jugada.'));
   const c=capture.current!, engine=preparedEngine();
   const keywords=[...c.data.teams.filter(t=>[c.match.localTeamId,c.match.visitorTeamId].includes(t.id)).map(t=>t.name),...c.data.players.filter(p=>[c.match.localTeamId,c.match.visitorTeamId].includes(p.teamId)&&!p.isUnknown&&!p.deletedAt&&p.name).map(p=>p.name),...voiceKeywords[setup.language]].map(w=>w.replace(/[\r\n]/g,' ').trim()).filter(Boolean).slice(0,80);
   const speechStart=performance.now();const transcript=await engine.transcribe(audio.samples,audio.sampleRate,keywords);if(!alive.current)return;timings.current.whistleMs=performance.now()-speechStart;
   const text=transcript.text.trim();if(!text)throw new Error(tr('No se ha reconocido voz. Acércate al micrófono y vuelve a intentarlo.'));
   setPhase('interpreting');setStatus(tr('Needle está interpretando la jugada…'));
   let proposal:unknown=null,warnings:string[]=[];
   const needleStart=performance.now();try{const response=await engine.interpret(text,[c.match.localTeamId,c.match.visitorTeamId].map(id=>c.data.teams.find(t=>t.id===id)!.name));proposal=response.proposal;warnings=response.warnings;timings.current.needleMs=performance.now()-needleStart;}
   catch(e){await discardVoiceEngine();if(alive.current)setError(voiceError(e));}
   if(alive.current){const value=toVoiceDraft(text,proposal,c);value.warnings.unshift(...warnings);setResult(value);setPhase('review');}
  }catch(e){await discardVoiceEngine();if(alive.current){setError(voiceError(e));setPhase('ready');}}
  finally{lock.current=false;processing.current=false;}
 };
 stopRef.current=()=>{held.current=false;void stop();};
 const start=async()=>{
  if(lock.current||phase!=='ready'||setup.phase!=='ready')return;
  timings.current={whistleMs:0,needleMs:0};held.current=true;lock.current=true;setError('');setResult(null);setSeconds(0);setPhase('permission');capture.current=captureContext(match,data);
  const mic=new VoiceRecorder();recorder.current=mic;
  try {
   const started=await mic.start(()=>stopRef.current());if(!alive.current){mic.cancel();return;}
   lock.current=false;
   if(started){setPhase('recording');if(!held.current)await stop();}else setPhase('ready');
  }catch(e){if(alive.current){setError(voiceError(e));setPhase('ready');}recorder.current=null;}
  finally{lock.current=false;}
 };
 const release=()=>{held.current=false;if(phase==='recording')void stop();};
 const cancelRecording=()=>{if(!['recording','permission'].includes(phase))return;held.current=false;recorder.current?.cancel();recorder.current=null;setPhase('ready');};
 const ready=setup.phase==='ready',problem=microphoneProblem();
 return <><button className={`hold-to-talk ${phase==='recording'?'recording':''}`} aria-label={phase==='recording'?tr('Grabando · {seconds} s',{seconds}):tr('Mantén pulsado para hablar')} disabled={!ready||Boolean(problem)||['transcribing','interpreting','review'].includes(phase)} aria-disabled={phase==='permission'}
   onPointerDown={e=>{if(e.button!==0||phase!=='ready')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);void start();}}
   onPointerUp={release} onPointerCancel={cancelRecording} onLostPointerCapture={release}
   onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();void start();}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release();}}} onBlur={release}>
   <Mic size={20}/>{phase==='recording'?tr('Grabando · {seconds} s',{seconds}):phase==='permission'?tr('Solicitando permiso…'):tr('Voz')}
  </button>
  {setup.phase==='loading'&&<p className="capture-status" role="status">{tr('Cargando modelos…')} {setup.progress}</p>}
  {!ready&&setup.phase!=='loading'&&<div className="capture-status" role="alert">{tr('Cactus no está cargado en este navegador. Elige el idioma y carga los modelos antes de iniciar el partido.')} <a href="#/ajustes">{tr('Preparar voz')}</a></div>}
  {(problem||error||setup.error)&&<div className="capture-status"><ErrorMessage text={problem||error||setup.error}/></div>}
  {['transcribing','interpreting'].includes(phase)&&<p className="capture-status" role="status">{status} {tr('Puedes seguir usando la entrada manual.')}</p>}
  {phase==='review'&&result&&(allowReview?<EventEditor data={data} match={match} initialDraft={result.draft} voiceWarnings={result.warnings} voiceTimings={timings.current} close={()=>{setResult(null);setPhase('ready');}}/>:<p className="capture-status" role="status">{tr('Propuesta lista. Termina la edición manual para revisarla.')}</p>)}
  {phase==='recording'&&<span className="sr-only" role="status">{tr('Micrófono activo. Máximo veinte segundos.')}</span>}
 </>;
}
