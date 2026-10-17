import type { JsonSchema } from 'cactus-needle/browser';
import { tr, type Language } from '../i18n';
import { definitions, eventTypes, type EventType } from '../domain/model';
import { normalize } from './interpretation';
import { voiceKeywords } from '../i18n/voice';
import { normalizeShirtNumbers } from './numbers';
const canonical:Record<EventType,string>={goal:'gol',save:'parada',miss:'fallo',loss:'perdida',recovery:'recuperacion',penalty:'penalti_cometido',exclusion:'exclusion',yellow:'amarilla',disqualification:'descalificacion',passive:'pasivo',infraction:'infraccion',substitution:'sustitucion'};
const escaped=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function captureFacts(language:Language) {
 const words=voiceKeywords[language];return `locale:${language}; sport:handball; equipo1=${words[2]}/${words[3]}; equipo2=${words[4]}/${words[5]}; NEVER home/away`;
}
export function routeSpokenEvent(text:string,language:Language):EventType|null {
 const value=normalize(text);
 if(/\b(no|not|nicht|kein|keine|pas|non|geen|nie|anulado|annulled)\b/u.test(value))return null;
 const options=eventTypes.map(type=>({type,phrase:normalize(tr(definitions[type].label,{},language))}));
 const first=options.find(({phrase})=>value===phrase||value.startsWith(phrase+' '));if(!first)return null;
 let count=0;for(const {phrase}of options)count+=[...value.matchAll(new RegExp(`(?:^|\\s)${escaped(phrase)}(?=\\s|$)`,'gu'))].length;
 return count===1?first.type:null;
}
const penaltyMention=/\b(penalti|penalty|penal|rigore|strafworp|karny|siebenmeter|siete metros|seven met(?:er|re)s?|sept metres|sette metri|zeven meter|siedem metrow|7 ?(?:m|metros|metres|meters))\b/u;
const relatedMention=/\b(asist\w*|assist\w*|vorlage\w*|passeur|passe decisive|aangever|asyst\w*|lanz\w*|tiro|shooter|shot|werfer|wurf|tireur|tiratore|schutter|rzut\w*|provoc\w*|drawn|benefic\w*|pierde|perdedor)\b/u;
const perspectiveWords:Record<Language,[string[],string[]]>={
 es:[['nuestro','nuestra','nuestros','nuestras','nosotros','nosotras','mi equipo'],['ellos','ellas','rival','rivales','contrario','contraria','contrarios','contrarias','suyo','suya','suyos','suyas','su equipo']],
 en:[['our','ours','us','we','my team'],['they','their','theirs','them','opponent','opponents']],
 de:[['unser','unsere','unseren','wir','uns'],['sie','ihr','ihre','ihren','gegner']],
 fr:[['notre','nos','nous'],['eux','elles','leur','leurs','adversaire','adversaires']],
 it:[['nostro','nostra','nostri','nostre','noi'],['loro','avversario','avversaria','avversari']],
 nl:[['ons','onze','wij','we'],['zij','ze','hun','tegenstander','tegenstanders']],
 pl:[['nasz','nasza','nasze','nasi','my','nas'],['oni','one','ich','rywal','rywalka','przeciwnik','przeciwnicy']],
};
function literalPerspective(primary:string,language:Language) {
 const found=perspectiveWords[language].map(words=>words.some(word=>new RegExp(`(?:^|\\s)${escaped(word)}(?=\\s|$)`,'u').test(primary)));
 return found[0]===found[1]?undefined:found[0]?'equipo1':'equipo2';
}
/** Routing only narrows the schema; Needle still extracts the proposal and applies its gates. */
export function toolForPlay(rawText:string,language:Language,names:string[]) {
 const text=normalizeShirtNumbers(rawText,language),plain=normalize(text),type=routeSpokenEvent(text,language);
 const relation=relatedMention.exec(plain),primary=relation?plain.slice(0,relation.index):plain;
 const teamReference=type?literalPerspective(primary,language):undefined;
 const team={type:'string' as const,description:`Primary player's team, literal reference: ${voiceKeywords[language].slice(2,6).join('/')} or ${names.join('/')}.`};
 const number={type:'integer' as const,minimum:0,maximum:99};
 const properties:Record<string,JsonSchema>={equipo:team};
 if(type!=='passive'){
  properties.dorsal={...number,description:'Primary shirt number.'};
  if(!/\d/.test(primary))properties.nombre={type:'string',description:'Primary player name, verbatim.'};
  if((!type||definitions[type].related)&&relation){
   properties.dorsal_relacionado={...number,description:type==='goal'?'Assist provider number.':'Related opponent number.'};
   if(!/\d/.test(plain.slice(relation.index)))properties.nombre_relacionado={type:'string',description:'Related player name, verbatim.'};
  }
 }
 if((!type||definitions[type].penalty)&&penaltyMention.test(plain))properties.penalti={type:'boolean',description:'Seven metre penalty, not a shirt number.'};
 if((!type||type==='disqualification')&&/\b(azul|blue|blau\w*|bleu|blu|niebiesk\w*)\b/u.test(plain))properties.azul={type:'boolean',description:'Blue card.'};
 if(!type||type==='infraction')properties.infraccion={type:'string',enum:['Pasos','Dobles','Pisando'],description:'Steps, double dribble or goal area violation.'};
 if(!type)properties.evento={type:'string',enum:[...Object.values(canonical),'desconocido'],description:'One handball action; unknown if not one action.'};
 const name=type?canonical[type]:'registrar_jugada';
 const inputSchema={type:'object' as const,properties,required:[],additionalProperties:false};
 const tools={[name]:{description:type?tr(definitions[type].label,{},language):'Single handball play.',inputSchema}};
 return {text,type,name,tools,teamReference,schemaCharacters:JSON.stringify(tools).length};
}
