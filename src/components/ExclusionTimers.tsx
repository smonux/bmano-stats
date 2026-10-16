import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, Volume2, X } from 'lucide-react';
import type { Match, Snapshot } from '../domain/model';
import { exclusionRemaining } from '../domain/exclusions';
import { repo } from '../data/database';
import { tr } from '../i18n';
import { Confirm, ErrorMessage, Modal, useAction } from './ui';
export function ExclusionTimers({match,data,now,onDialogChange}:{match:Match;data:Snapshot;now:number;onDialogChange:(open:boolean)=>void}) {
 const timers=match.exclusions ?? [null,null,null];
 const [editing,setEditing]=useState<number|null>(null),[clearing,setClearing]=useState<number|null>(null);
 const [teamId,setTeam]=useState(match.localTeamId),[dorsal,setDorsal]=useState('');
 const [sound,setSound]=useState(false),[soundError,setSoundError]=useState('');
 const audio=useRef<AudioContext|null>(null),announced=useRef(new Set<string>()), a=useAction();
 useEffect(()=>()=>{void audio.current?.close();},[]);
 useEffect(()=>{onDialogChange(editing!==null||clearing!==null);return()=>onDialogChange(false);},[editing,clearing,onDialogChange]);
 useEffect(()=>{
  for(const timer of timers) if(timer && exclusionRemaining(timer,now)===0 && !announced.current.has(timer.id)) {
   announced.current.add(timer.id);
   if(sound && audio.current?.state==='running') {
    const ctx=audio.current, osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.frequency.value=880;gain.gain.setValueAtTime(.15,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.8);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.8);
   }
  }
 },[timers,now,sound]);
 const toggleSound=async()=>{
  if(sound){setSound(false);return;}
  try{audio.current??=new AudioContext();await audio.current.resume();if(audio.current.state!=='running')throw new Error();setSound(true);setSoundError('');}
  catch{setSoundError(tr('No se pudo activar el sonido.'));}
 };
 return <section className="exclusions" aria-label={tr('Cuenta atrás de exclusiones')}>
  <div className="exclusion-heading"><h2>{tr('Exclusiones (2 min)')}</h2><button className="text-button" aria-pressed={sound} onClick={()=>void toggleSound()}><Volume2 size={16}/>{tr(sound?'Sonido activado':'Aviso sonoro')}</button></div>
  <div className="exclusion-grid">{timers.map((timer,i)=>{
   const remaining=timer?exclusionRemaining(timer,now):120000,seconds=Math.ceil(remaining/1000), finished=Boolean(timer && remaining===0);
   return <div className={`exclusion-timer ${finished?'expired':''}`} key={i} role="group" aria-label={tr('Exclusión {number}',{number:i+1})}>
    {timer?<><span className="timer-player" title={data.teams.find(t=>t.id===timer.teamId)?.name}>{timer.teamId===match.localTeamId?'1':'2'} · #{timer.dorsal}</span><span className="timer-team">{data.teams.find(t=>t.id===timer.teamId)?.name}</span></>:<span className="timer-player">{tr('Libre')} · {i+1}</span>}
    <strong className="timer-digits">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</strong>
    <span className="timer-state" role="status">{finished?tr('Puede volver'):timer && (!timer.running||match.clock.startedAt===null)?tr('Pausado'):'\u00a0'}</span>
    <div className="timer-actions">{!timer?<button disabled={match.status==='done'} onClick={()=>{setEditing(i);setDorsal('');setTeam(match.localTeamId);}}><Plus size={15}/>{tr('Activar')}</button>:<>{!finished&&<button disabled={a.busy||match.status==='done'} onClick={()=>a.run(()=>repo.exclusion(match.id,i,timer.running?'pause':'resume'))}>{timer.running?<Pause size={15}/>:<Play size={15}/>}<span className="sr-only">{tr(timer.running?'Parar':'Reanudar')}</span></button>}<button disabled={a.busy||match.status==='done'} aria-label={tr('Liberar')} onClick={()=>finished?a.run(()=>repo.exclusion(match.id,i,'clear')):setClearing(i)}><X size={15}/>{finished?tr('Liberar'):null}</button></>}</div>
   </div>;
  })}</div>
  <p className="caption">{tr('Sigue el reloj del partido. Mantén la aplicación abierta para recibir avisos. Registra la exclusión como evento aparte.')}</p>
  <ErrorMessage text={a.error||soundError}/>
  {editing!==null&&<Modal title={tr('Exclusión {number}',{number:editing+1})} close={()=>!a.busy&&setEditing(null)}><form onSubmit={e=>{e.preventDefault();a.run(async()=>{await repo.exclusion(match.id,editing,'start',{teamId,dorsal:Number(dorsal)});setEditing(null);});}}><label>{tr('Equipo')}<select aria-label={tr('Equipo')} value={teamId} onChange={e=>setTeam(e.target.value)}>{[match.localTeamId,match.visitorTeamId].map(id=><option key={id} value={id}>{data.teams.find(t=>t.id===id)?.name}</option>)}</select></label><label>{tr('Dorsal')}<input autoFocus required inputMode="numeric" pattern="[0-9]{1,2}" maxLength={2} value={dorsal} onChange={e=>setDorsal(e.target.value.replace(/\D/g,''))}/></label><ErrorMessage text={a.error}/><button className="primary full" disabled={a.busy||!dorsal}>{tr('Activar')} · 02:00</button></form></Modal>}
  {clearing!==null&&<Confirm title={tr('Liberar contador')} text={tr('Se borrará este contador. La estadística de exclusión no cambia.')} close={()=>setClearing(null)} confirm={()=>repo.exclusion(match.id,clearing,'clear')}/>}
 </section>;
}
