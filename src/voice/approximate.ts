import type { Language } from '../i18n';
import type { SpokenEvent } from './lexicon';
import { numberKey } from './numbers';
const vocabulary:Record<Language,Record<SpokenEvent,string>>={
 es:{gol:'gol|asistencia',parada:'parada',fallo:'fallo|fallado',perdida:'pérdida',recuperacion:'recuperación',penalti_cometido:'penalti|penal|penalty',exclusion:'exclusión|dos minutos|2 minutos',amarilla:'amarilla|amonestación',descalificacion:'descalificación|roja|azul',pasivo:'pasivo',infraccion:'infracción|pasos|dobles|pisando'},
 en:{gol:'goal|assist',parada:'save',fallo:'miss|missed',perdida:'turnover',recuperacion:'recovery|steal',penalti_cometido:'penalty',exclusion:'suspension|two minutes|2 minutes',amarilla:'yellow',descalificacion:'disqualification|red|blue',pasivo:'passive',infraccion:'violation|steps|double dribble'},
 de:{gol:'Tor|Vorlage',parada:'Parade',fallo:'Fehlwurf',perdida:'Ballverlust',recuperacion:'Ballgewinn',penalti_cometido:'Siebenmeter',exclusion:'Zeitstrafe|zwei Minuten|2 Minuten',amarilla:'gelb|Verwarnung',descalificacion:'Disqualifikation|rot|blau',pasivo:'passiv',infraccion:'Schritte|Doppeldribbling|Kreisbetreten'},
 fr:{gol:'but|passe décisive',parada:'arrêt',fallo:'raté',perdida:'perte',recuperacion:'récupération|interception',penalti_cometido:'penalty|sept mètres',exclusion:'exclusion|deux minutes|2 minutes',amarilla:'jaune',descalificacion:'disqualification|rouge|bleu',pasivo:'passif',infraccion:'marcher|reprise de dribble|empiètement'},
 it:{gol:'gol|assist',parada:'parata',fallo:'sbagliato',perdida:'palla persa',recuperacion:'recupero',penalti_cometido:'rigore',exclusion:'esclusione|due minuti|2 minuti',amarilla:'giallo',descalificacion:'squalifica|rosso|blu',pasivo:'passivo',infraccion:'passi|doppio palleggio|invasione area'},
 nl:{gol:'doelpunt|assist',parada:'redding',fallo:'misser',perdida:'balverlies',recuperacion:'balwinst',penalti_cometido:'strafworp|penalty',exclusion:'tijdstraf|twee minuten|2 minuten',amarilla:'geel',descalificacion:'diskwalificatie|rood|blauw',pasivo:'passief',infraccion:'loopfout|dubbele dribbel'},
 pl:{gol:'bramka|asysta',parada:'obrona',fallo:'pudło',perdida:'strata',recuperacion:'przechwyt',penalti_cometido:'karny',exclusion:'wykluczenie|dwie minuty|2 minuty',amarilla:'żółta',descalificacion:'dyskwalifikacja|czerwona|niebieska',pasivo:'pasywna',infraccion:'kroki|podwójne kozłowanie'},
};
/** Bounded optimal-string-alignment distance, including adjacent ASR letter swaps. */
function distance(left:string,right:string){
 const rows=Array.from({length:left.length+1},(_,i)=>[i,...Array(right.length).fill(0)]);
 for(let j=0;j<=right.length;j++)rows[0][j]=j;
 for(let i=1;i<=left.length;i++)for(let j=1;j<=right.length;j++){
  rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+Number(left[i-1]!==right[j-1]));
  if(i>1&&j>1&&left[i-1]===right[j-2]&&left[i-2]===right[j-1])rows[i][j]=Math.min(rows[i][j],rows[i-2][j-2]+1);
 }
 return rows[left.length][right.length];
}
export function approximateEvent(words:readonly string[],language:Language,excluded:ReadonlySet<number>){
 const options:{event:SpokenEvent;from:number;to:number;score:number}[]=[];
 for(const [event,aliases]of Object.entries(vocabulary[language]) as [SpokenEvent,string][])for(const alias of aliases.split('|')){
  const reference=numberKey(alias),size=reference.split(' ').length;
  for(let from=0;from+size<=words.length;from++){
   const to=from+size;if(Array.from({length:size},(_,i)=>from+i).some(index=>excluded.has(index)))continue;
   const value=words.slice(from,to).join(' ');if(value.length<4)continue;
   const prefix=size===1&&value.length>=5&&reference.startsWith(value)&&value.length/reference.length>=0.55;
   if(Math.abs(value.length-reference.length)>2&&!prefix)continue;
   const edits=distance(value,reference),limit=reference.length>=9?2:1;
   if(edits>limit&&!prefix)continue;
   options.push({event,from,to,score:prefix?0.8:1-edits/Math.max(reference.length,value.length)});
  }
 }
 options.sort((a,b)=>b.score-a.score||a.from-b.from);
 const best=options[0];if(!best)return undefined;
 if(options.some(option=>option.event!==best.event&&best.score-option.score<0.12))return undefined;
 return best;
}
