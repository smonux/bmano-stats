import { useState } from 'react';
import { ArrowRight, Check, Mic, ShieldCheck, Timer, Users } from 'lucide-react';
import { languages, setLanguage, tr, useLanguage, type Language } from '../i18n';
import { Modal } from './ui';
export function LanguagePicker() {
  const language=useLanguage();
  return <label className="language-picker">{tr('Idioma')}<select aria-label={tr('Idioma')} value={language} onChange={e=>setLanguage(e.target.value as Language)}>{Object.entries(languages).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>;
}
const slides = [
 {title:'Mira el partido. Cuenta la jugada.',body:'Dos equipos y una fecha bastan. Añade dorsales al registrar y completa los nombres después. Amarillo y negro en homenaje al Balonmano La Jota de Zaragoza.',icon:Users},
 {title:'Prepara la voz antes del pitido',body:'Elige tu idioma, descarga los modelos con conexión y permite el micrófono. Después, el audio se procesa en este dispositivo. Prueba una jugada antes de empezar.',icon:ShieldCheck},
 {title:'Pulsa, habla, revisa y guarda',body:'Una jugada por grabación. Mantén pulsado o usa un toque para empezar y otro para terminar. Whistle transcribe y Needle propone; tú confirmas. La entrada manual sigue disponible.',icon:Mic},
 {title:'Tu perspectiva manda',body:'Nosotros y nuestro siempre son equipo 1. Ellos, rival y suyo son equipo 2. No cambia por jugar en casa o fuera. Di el dorsal y revisa las propuestas dudosas.',icon:Users},
 {title:'Controla los dos minutos',body:'Tres contadores con equipo y dorsal. Actívalos al comenzar la exclusión; siguen el reloj del partido y puedes pararlos por separado. Al llegar a cero, avisan de la reincorporación. El evento estadístico se registra aparte.',icon:Timer},
];
export function hasSeenWelcome() {try{return localStorage.getItem('handball-welcome-v1')==='done';}catch{return false;}}
export function Welcome({close}:{close:()=>void}) {
 const [step,setStep]=useState(0), slide=slides[step];
 const finish=()=>{try{localStorage.setItem('handball-welcome-v1','done');}catch{}close();};
 return <Modal title={tr('Guía de pista')} close={finish}>
   <div className="welcome"><LanguagePicker/>
   <div className="welcome-visual" aria-hidden="true"><slide.icon size={44}/>
    {step===0?<div className="welcome-score"><span>01</span><b>12 : 10</b><span>02</span></div>:step===1?<><b>Whistle + Needle</b><span>53 MB · ES EN DE FR IT NL PL</span><div className="welcome-wave">▂ ▅ ▃ █ ▅ ▂ ▆ ▃</div></>:step===2?<><div className="welcome-wave">▂ ▅ ▃ █ ▅ ▂ ▆ ▃</div><div className="welcome-flow"><Mic size={18}/><ArrowRight size={16}/><span>{tr('Gol')} · #7</span><ArrowRight size={16}/><Check size={20}/></div></>:step===3?<div className="welcome-teams"><b>{tr('Equipo 1 (nuestro)')}</b><span>{tr('Equipo 2 (rival)')}</span></div>:<div className="welcome-timers"><span>#7<b>02:00</b></span><span>#9<b>00:38</b></span><span>#4<b>00:00</b></span></div>}
   </div>
   <div className="welcome-copy" aria-live="polite"><span className="eyebrow">{step+1} / {slides.length}</span><h3>{tr(slide.title)}</h3><p>{tr(slide.body)}</p></div>
   <div className="welcome-dots">{slides.map((s,i)=><button key={i} type="button" aria-label={tr(s.title)} aria-current={step===i?'step':undefined} onClick={()=>setStep(i)}><span/></button>)}</div>
   <div className="actions"><button onClick={()=>setStep(step-1)} disabled={step===0}>{tr('Anterior')}</button><button className="primary" onClick={()=>step===slides.length-1?finish():setStep(step+1)}>{tr(step===slides.length-1?'Empezar':'Siguiente')}<ArrowRight size={16}/></button></div>
   <button className="text-button full" onClick={finish}>{tr('Omitir guía')}</button>
   </div>
 </Modal>;
}
