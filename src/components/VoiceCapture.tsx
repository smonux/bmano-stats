import { useEffect, useRef, useState } from 'react';
import { Mic, Square, X } from 'lucide-react';
import type { Match, Snapshot } from '../domain/model';
import { VoiceEngine, voiceError } from '../voice/engine';
import { VoiceRecorder } from '../voice/recorder';
import { captureContext, toVoiceDraft, type CaptureContext } from '../voice/interpretation';
import { EventEditor } from './EventEditor';
import { ErrorMessage } from './ui';
type Phase = 'idle'|'loading'|'ready'|'permission'|'recording'|'transcribing'|'interpreting'|'review';
type Result = ReturnType<typeof toVoiceDraft>;
export function VoiceCapture({match,data,allowReview,close}:{match:Match;data:Snapshot;allowReview:boolean;close:()=>void}) {
  const [phase,setPhase]=useState<Phase>('idle'), [status,setStatus]=useState(''), [error,setError]=useState('');
  const [result,setResult]=useState<Result|null>(null), [raw,setRaw]=useState('');
  const [seconds,setSeconds]=useState(0);
  const engine=useRef<VoiceEngine|null>(null), recorder=useRef<VoiceRecorder|null>(null);
  const alive=useRef(true), lock=useRef(false), held=useRef(false), capture=useRef<CaptureContext|null>(null);
  const stopRef=useRef<()=>void>(()=>{});
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;recorder.current?.cancel();void engine.current?.close();};},[]);
  useEffect(()=>{if(phase!=='recording') return;const start=Date.now();const timer=setInterval(()=>setSeconds(Math.min(20,Math.floor((Date.now()-start)/1000))),200);return()=>clearInterval(timer);},[phase]);
  const prepare=async()=>{
    if(lock.current) return; lock.current=true;setError('');setPhase('loading');
    const current=new VoiceEngine();engine.current=current;
    try {await current.prepare(text=>{if(alive.current)setStatus(text);});if(alive.current)setPhase('ready');}
    catch(e){if(alive.current){setError(voiceError(e,true));setPhase('idle');}}
    finally{lock.current=false;}
  };
  const stop=async()=>{
    if(!recorder.current || lock.current) return;
    lock.current=true;setPhase('transcribing');setStatus('Whistle está transcribiendo…');
    try {
      const audio=await recorder.current.stop();recorder.current=null;
      if(!alive.current) return;
      if(audio.samples.length<audio.sampleRate*.25) throw new Error('La grabación es demasiado corta. Mantén pulsado hasta terminar la jugada.');
      const c=capture.current!;
      const keywords=[...c.data.teams.filter(t=>[c.match.localTeamId,c.match.visitorTeamId].includes(t.id)).map(t=>t.name),...c.data.players.filter(p=>[c.match.localTeamId,c.match.visitorTeamId].includes(p.teamId)&&!p.isUnknown&&!p.deletedAt&&p.name).map(p=>p.name),'gol','dorsal','nuestro','nosotros','ellos','rival','parada','pasos','dobles','pisando','exclusión','penalti','pasivo'].map(word=>word.replace(/[\r\n]/g,' ').trim()).filter(Boolean).slice(0,80);
      const transcript=await engine.current!.transcribe(audio.samples,audio.sampleRate,keywords);
      if(!alive.current) return;
      const text=transcript.text.trim();
      if(!text) throw new Error('No se ha reconocido voz. Acércate al micrófono y vuelve a intentarlo.');
      setRaw(text);setPhase('interpreting');setStatus('Needle está interpretando la jugada…');
      let interpreted:unknown=null;let warnings:string[]=[];
      try{const response=await engine.current!.interpret(text,[c.match.localTeamId,c.match.visitorTeamId].map(id=>c.data.teams.find(t=>t.id===id)!.name));interpreted=response.proposal;warnings=response.warnings;}catch(e){await engine.current?.close();engine.current=null;if(alive.current)setError(voiceError(e));}
      if(alive.current){const result=toVoiceDraft(text,interpreted,c);result.warnings.unshift(...warnings);setResult(result);setPhase('review');}
    }catch(e){await engine.current?.close();engine.current=null;if(alive.current){setError(voiceError(e));setPhase('idle');}}
    finally{lock.current=false;}
  };
  stopRef.current=()=>{void stop();};
  const start=async(hold=false)=>{
    if(lock.current || phase!=='ready') return;
    held.current=hold;lock.current=true;setError('');setRaw('');setResult(null);setSeconds(0);setPhase('permission');
    capture.current=captureContext(match,data);
    const mic=new VoiceRecorder();recorder.current=mic;
    try {
      const started=await mic.start(()=>stopRef.current());
      if(!alive.current){mic.cancel();return;}
      lock.current=false;
      if(started){setPhase('recording');if(hold&&!held.current) await stop();}
      else setPhase('ready');
    } catch(e){if(alive.current){setError(voiceError(e));setPhase('ready');}recorder.current=null;}
    finally{lock.current=false;}
  };
  const release=()=>{held.current=false;if(phase==='recording')void stop();};
  const cancel=()=>{recorder.current?.cancel();void engine.current?.close();close();};
  const teamName=(id:string)=>data.teams.find(t=>t.id===id)?.name??'';
  return <section className="voice-panel panel" aria-label="Captura por voz">
    <div className="section-heading"><h2><Mic size={20}/> Captura por voz <span className="small-tag">En pruebas</span></h2><button className="icon-button" aria-label="Cerrar captura por voz" onClick={cancel}><X size={20}/></button></div>
    <p className="muted">Una jugada por grabación, hasta 20 segundos. Revisa el resultado antes de guardarlo.</p>
    <p className="caption">Desde tu perspectiva: «nuestro/nosotros» = equipo 1 ({teamName(match.localTeamId)}); «ellos/rival/suyo» = equipo 2 ({teamName(match.visitorTeamId)}). No depende de quién juega en casa.</p>
    <p className="caption">Ejemplo: «gol nuestro, dorsal siete». También puedes usar el nombre del equipo.</p>
    {phase==='idle'&&<><p>Prepara Whistle y Needle (unos 53 MB). La primera descarga necesita conexión; después se reutilizan si el navegador conserva la caché. El audio se procesa aquí y se descarta tras transcribirlo.</p><button className="primary" onClick={()=>void prepare()}>Preparar voz local</button></>}
    {phase==='loading'&&<p role="status">{status}</p>}
    {['ready','permission','recording'].includes(phase)&&<div className="voice-controls">
      <button className={`primary hold-to-talk ${phase==='recording'?'recording':''}`} aria-disabled={phase==='permission'} onPointerDown={e=>{if(e.button!==0||phase!=='ready')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);void start(true);}} onPointerUp={release} onPointerCancel={()=>{if(phase==='recording'||phase==='permission'){held.current=false;recorder.current?.cancel();recorder.current=null;setPhase('ready');}}} onLostPointerCapture={release} onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();void start(true);}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release();}}}>
        <Mic size={20}/>{phase==='recording'?`Grabando · ${seconds} s${held.current?' · suelta para terminar':''}`:phase==='permission'?'Abriendo micrófono…':'Mantén pulsado para hablar'}
      </button>
      <button disabled={phase==='permission'} onClick={()=>phase==='recording'?void stop():void start()}>{phase==='recording'?<><Square size={16}/> Terminar grabación</>:'Grabar con un toque'}</button>
    </div>}
    {['transcribing','interpreting'].includes(phase)&&<p role="status">{status} Puedes seguir usando la entrada manual.</p>}
    {raw&&<p className="voice-transcript"><strong>Transcripción original</strong><span>«{raw}»</span></p>}
    <ErrorMessage text={error}/>
    {phase==='review'&&result&&<><ul className="voice-warnings">{result.warnings.map(w=><li key={w}>{w}</li>)}</ul><button onClick={()=>{setResult(null);setRaw('');setPhase(engine.current?.ready?'ready':'idle');}}>Otra grabación</button>{allowReview?<EventEditor data={data} match={match} initialDraft={result.draft} voiceWarnings={result.warnings} close={()=>{setResult(null);setPhase(engine.current?.ready?'ready':'idle');}}/>:<p role="status">Propuesta lista. Termina la edición manual para revisarla.</p>}</>}
    {phase==='recording'&&<span className="sr-only" role="status">Micrófono activo. Máximo veinte segundos.</span>}
  </section>;
}
