import type { Language } from '../i18n';
import { lexicons, spokenEvents, type SpokenEvent } from './lexicon';
import { numberAt, numberKey } from './numbers';
import { approximateEvent } from './approximate';
import { substitutionRoles } from './substitution';
export type RulePlayer={name:string;team:'equipo1'|'equipo2'};
export type RuleProposal={evento:SpokenEvent|'desconocido';equipo:'equipo1'|'equipo2'|'desconocido';dorsal?:number;nombre?:string;dorsal_relacionado?:number;nombre_relacionado?:string;penalti?:boolean;azul?:boolean;infraccion?:'Pasos'|'Dobles'|'Pisando'};
type Span={from:number;to:number};
type Token={key:string;raw:string;start:number;end:number};
type Entity=Span&{nombre?:string;dorsal?:number};
type TeamReference=Span&{team:'equipo1'|'equipo2'};
const expressionCache=new Map<string,RegExp>();
const escaped=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const relatedEvents=new Set<SpokenEvent>(['gol','parada','recuperacion','penalti_cometido','exclusion','descalificacion']);
const overlaps=(left:Span,right:Span)=>left.from<right.to&&right.from<left.to;
const contains=(outer:Span,inner:Span)=>inner.from>=outer.from&&inner.to<=outer.to;
const review='Interpretación por reglas: revisa los campos antes de guardar.';
export function interpretDeterministically(text:string,language:Language,teams:string[],players:RulePlayer[]=[]) {
 const warnings:string[]=[review];
 const empty=(reason:string)=>({proposal:null,warnings:[...warnings,reason],eventKeyword:'',eventMatch:'none' as const});
 if(!text.trim()||text.length>10000)return empty('No se ha identificado un evento por palabras clave.');
 const tokens:Token[]=[...text.matchAll(/[\p{L}\p{N}]+/gu)].map(match=>({key:numberKey(match[0]),raw:match[0],start:match.index!,end:match.index!+match[0].length}));
 const keys=tokens.map(token=>token.key),plain=keys.join(' '),offsets:number[]=[];let offset=0;
 for(const key of keys){offsets.push(offset);offset+=key.length+1;}
 const matches=(source:string):Span[]=>{
  let expression=expressionCache.get(source);
  if(!expression){expression=new RegExp(`(?<!\\S)(?:${source})(?!\\S)`,'gu');expressionCache.set(source,expression);}
  return [...plain.matchAll(expression)].map(match=>({from:offsets.indexOf(match.index!),to:offsets.findIndex(value=>value>=match.index!+match[0].length)})).map(span=>({...span,to:span.to<0?tokens.length:span.to}));
 };
 const raw=(span:Span)=>text.slice(tokens[span.from]?.start??0,tokens[span.to-1]?.end??text.length);
 const lex=lexicons[language];
 const teamNames=teams.slice(0,2).flatMap((name,index)=>name.trim()?matches(escaped(numberKey(name))).map(span=>({...span,team:index===0?'equipo1' as const:'equipo2' as const})):[]);
 const references:TeamReference[]=[...teamNames,...matches(lex.own).map(span=>({...span,team:'equipo1' as const})),...matches(lex.opponent).map(span=>({...span,team:'equipo2' as const}))]
  .filter(ref=>!teamNames.some(name=>overlaps(name,ref)&&!contains(ref,name)));
 const knownNames=players.filter(player=>player.name.trim()).flatMap(player=>matches(escaped(numberKey(player.name))));
 const correction=matches(lex.correction).at(-1);
 const uncertain=matches(lex.uncertain);
 if(/[?¿]/u.test(text)||matches(lex.question).some(span=>span.from===0))return empty('La frase expresa una pregunta o duda. Completa el evento manualmente.');
 if(uncertain.length){
  const confirmed:Record<Language,string>={es:'sancionad[oa]|sanciono|ha recibido (?:una )?sancion|han pitado algo|le han pitado',en:'was sanctioned|has been sanctioned|was penalized',de:'bestraft',fr:'sanctionne|sanctionnee',it:'sanzionato|sanzionata',nl:'bestraft',pl:'ukarany|ukarana'};
  if(!matches(confirmed[language]).length)return empty('La frase expresa una pregunta o duda. Completa el evento manualmente.');
  const boundary=uncertain[0].from,region={from:0,to:boundary};
  const teamValues=new Set(references.filter(ref=>contains(region,ref)).map(ref=>ref.team));
  const proposal:RuleProposal={evento:'desconocido',equipo:teamValues.size===1?[...teamValues][0]:'desconocido'};
  const seenNumbers:number[]=[];
  for(let i=0;i<boundary;i++){const value=numberAt(keys,i,language);if(value){if(value.value!==undefined&&!['un','una','ein','eine','une','een'].includes(keys[i]))seenNumbers.push(value.value);i=value.end-1;}}
  if(seenNumbers.length===1)proposal.dorsal=seenNumbers[0];
  const stop=new Set(lex.stop.split(' ')),names:Span[]=[];
  for(let i=0;i<boundary;i++){
   if(!/^\p{Lu}/u.test(tokens[i].raw)||stop.has(keys[i])||references.some(ref=>ref.from<=i&&ref.to>i)||numberAt(keys,i,language))continue;
   let end=i+1;while(end<boundary&&/^\p{Lu}/u.test(tokens[end].raw)&&!stop.has(keys[end]))end++;
   names.push({from:i,to:end});i=end-1;
  }
  if(names.length===1)proposal.nombre=raw(names[0]);
  return {proposal,warnings:[review,'La sanción está clara, pero su tipo no. Completa el evento manualmente.'],eventKeyword:'',eventMatch:'literal' as const};
 }
 if(matches(lex.cancelled).length)return empty('La jugada está negada o anulada. No se han supuesto datos.');
 const context:Record<Language,{clothes:string;card:string;score:string;remaining:string;suspension:string}>={
  es:{clothes:'camiseta|equipacion|camisa',card:'tarjeta|descalificacion',score:'marcador|tanteador|tanteo',remaining:'quedan|restan|faltan',suspension:'exclusion|excluido|excluida'},
  en:{clothes:'shirt|jersey|kit',card:'card|disqualification|sent off',score:'scoreboard|score is',remaining:'remaining|left',suspension:'suspension|suspended'},
  de:{clothes:'trikot|hemd',card:'karte|disqualifikation',score:'spielstand|anzeigetafel',remaining:'ubrig|verbleiben|noch',suspension:'zeitstrafe|hinausstellung'},
  fr:{clothes:'maillot|tenue',card:'carton|disqualification',score:'tableau|score',remaining:'restent|reste',suspension:'exclusion|exclu|exclue'},
  it:{clothes:'maglia|divisa',card:'cartellino|squalifica',score:'tabellone|punteggio',remaining:'rimangono|restano',suspension:'esclusione|escluso|esclusa'},
  nl:{clothes:'shirt|tenue',card:'kaart|diskwalificatie',score:'scorebord|stand',remaining:'resteren|over',suspension:'tijdstraf|uitsluiting'},
  pl:{clothes:'koszulka|koszulki|stroj',card:'kartka|dyskwalifikacja',score:'tablica|wynik',remaining:'pozostaly|pozostalo|zostaly',suspension:'wykluczenie|wykluczony|wykluczona'},
 };
 const ctx=context[language];
 const sub=lex.substitution;
 const roleMatches=(source:string)=>matches(source).filter(span=>![...knownNames,...teamNames].some(name=>overlaps(name,span)));
 const outgoing=roleMatches(sub.out),incoming=roleMatches(sub.in),connectors=roleMatches(sub.connector);
 const blockedSubstitution=matches(sub.irrelevant).length>0;
 const substitutionNoun=roleMatches(sub.noun).length>0;
 const directionalSubstitution=outgoing.length>0&&incoming.length>0||language==='es'&&connectors.length>0&&(outgoing.length>0||incoming.length>0);

 const candidates=spokenEvents.flatMap(event=>matches(lex.events[event]).filter(span=>![...teamNames,...knownNames].some(name=>overlaps(name,span))).map(span=>({...span,event}))).filter(cue=>{
  if(cue.event==='sustitucion'&&(blockedSubstitution||!substitutionNoun&&!directionalSubstitution))return false;
  if(cue.event==='descalificacion'&&matches(ctx.clothes).length&&!matches(ctx.card).length)return false;
  if(cue.event==='gol'&&matches(ctx.score).length)return false;
  if(cue.event==='exclusion'&&matches(ctx.remaining).length&&!matches(ctx.suspension).length)return false;
  if(language==='es'&&cue.event==='fallo'&&/fuera|desviado/u.test(raw(cue))&&!matches('tiro|lanzamiento|lanza|lanzo|tira|tiro').length)return false;
  return true;
 });
 let approximated=false;
 if(!candidates.length&&!matches([ctx.clothes,ctx.score,ctx.remaining].join('|')).length){
  const excluded=new Set<number>();
  for(const span of teamNames)for(let i=span.from;i<span.to;i++)excluded.add(i);
  for(const player of players)for(const span of matches(escaped(numberKey(player.name))))for(let i=span.from;i<span.to;i++)excluded.add(i);
  const closest=approximateEvent(keys,language,excluded);
  if(closest&&!(closest.event==='sustitucion'&&blockedSubstitution)){candidates.push(closest);approximated=true;warnings.push('Evento reconocido por aproximación de palabra clave. Revisa el tipo de evento.');}
 }
 const missedNegations=matches(lex.missNegation);
 const negations=matches(lex.negation).filter(span=>!missedNegations.some(miss=>contains(miss,span)));
 // Negation gates the action, not an explicitly absent assist or an earlier corrected shirt.
 const negated=candidates.some(cue=>negations.some(neg=>neg.from<=cue.from&&cue.from-neg.to<=3&&!(correction&&neg.to<correction.from&&cue.from>=correction.to)));
 if(negated)return empty('La jugada está negada o anulada. No se han supuesto datos.');
 const distinct=new Set(candidates.map(cue=>cue.event));
 if(language==='es'){
  if(distinct.has('parada')&&distinct.has('gol')&&matches('(?:evitar|evito|nego) (?:el )?(?:gol|tanto)').length)distinct.delete('gol');
  if(distinct.has('penalti_cometido')&&distinct.has('infraccion')&&!Object.values(lex.infraction).some(source=>matches(source).length))distinct.delete('infraccion');
  if(distinct.has('pasivo')&&distinct.has('parada')&&matches('arbitr[oa]').length)distinct.delete('parada');
 }
 // A distance alone doesn't say whether a penalty was conceded, scored, saved or missed.
 if(distinct.size===1&&distinct.has('penalti_cometido')&&/^(?:siete|7) (?:metros|m)$/u.test(plain))return empty('No se ha identificado un evento por palabras clave.');
 // A seven-metre qualifier belongs to the shot. A separately committed penalty remains a second action.
 if([...distinct].some(event=>['gol','parada','fallo'].includes(event))&&!matches(lex.committed).some(span=>candidates.some(cue=>cue.event==='penalti_cometido'&&Math.abs(span.from-cue.from)<=4)))distinct.delete('penalti_cometido');
 if(distinct.has('fallo')&&missedNegations.length)distinct.delete('gol');
 if(distinct.has('recuperacion')&&distinct.has('perdida')){
  const losses=candidates.filter(cue=>cue.event==='perdida');
  // Explicit opposing ball-loser may be a participant in this recovery, not a second stored play.
  if(losses.length===1&&matches(lex.relation.recuperacion!.after+'|'+lex.relation.recuperacion!.before).some(span=>overlaps(span,losses[0])))distinct.delete('perdida');
 }
 if(distinct.has('pasivo')&&matches(lex.warningOnly).length)return empty('Solo se ha reconocido un aviso de pasivo, sin infracción confirmada.');
 if(distinct.size!==1)return empty(distinct.size?'Hay varias acciones posibles. Registra una jugada por grabación.':'No se ha identificado un evento por palabras clave.');
 const event=[...distinct][0],eventCues=candidates.filter(cue=>cue.event===event);
 // Repeated explicit event nouns with a second participant are ambiguous even if the type agrees.
 const noun=numberKey(({gol:'gol',parada:'parada',fallo:'fallo',perdida:'perdida',recuperacion:'recuperacion',penalti_cometido:'penalti',exclusion:'exclusion',amarilla:'amarilla',descalificacion:'descalificacion',pasivo:'pasivo',infraccion:'infraccion',sustitucion:'sustitucion'})[event]);
 if(eventCues.filter(cue=>keys.slice(cue.from,cue.to).join(' ')===noun).length>1)return empty('Hay varias acciones posibles. Registra una jugada por grabación.');
 const proposal:RuleProposal={evento:event,equipo:'desconocido'};
 if(['gol','parada','fallo'].includes(event)&&matches(lex.penalty).length)proposal.penalti=true;
 if(event==='descalificacion'&&matches(lex.blue).length)proposal.azul=true;
 if(event==='infraccion'){
  const subtypes=(Object.keys(lex.infraction) as (keyof typeof lex.infraction)[]).filter(kind=>matches(lex.infraction[kind]).length);
  if(subtypes.length===1)proposal.infraccion=subtypes[0];
  else if(subtypes.length>1)return empty('Hay varias acciones posibles. Registra una jugada por grabación.');
 }
 const occupied=new Set<number>();
 const occupy=(span:Span)=>{for(let i=span.from;i<span.to;i++)occupied.add(i);};
 [...candidates,...references,...matches(lex.shirt+'|'+lex.timePrefix+'|'+lex.units+'|'+lex.correction)].forEach(occupy);
 const numbers:Entity[]=[];
 for(let i=0;i<tokens.length;i++){
  const match=numberAt(keys,i,language);if(!match)continue;
  const span={from:i,to:match.end};occupy(span);i=match.end-1;
  if(references.some(ref=>overlaps(ref,span))||knownNames.some(name=>overlaps(name,span))||candidates.some(cue=>contains(cue,span)))continue;
  const previous=keys[span.from-1]??'',next=keys[span.to]??'';
  const is=(source:string,value:string)=>new RegExp(`^(?:${source})$`,'u').test(value);
  const preceding=text.slice(Math.max(0,tokens[span.from].start-1),tokens[span.from].start);
  const previousNumeric=span.from>0&&/^\d+$/.test(previous),nextNumeric=/^\d+$/.test(next);
  const punctuation=previousNumeric?text.slice(tokens[span.from-1].end,tokens[span.from].start):nextNumeric?text.slice(tokens[span.to-1].end,tokens[span.to].start):'';
  if(is(lex.timePrefix,previous)||is(lex.units,next)||/[-−+]/u.test(preceding)||(/[.,:]/u.test(punctuation)&&(previousNumeric||nextNumeric)))continue;
  // Score pairs written as 12-10, 12:10 or 12 to 10 aren't shirts.
  const afterNumber=numberAt(keys,span.to+1,language),beforeNumber=span.from>=2?numberAt(keys,span.from-2,language):undefined;
  if((/^(?:a|to|zu|do)$/u.test(next)&&afterNumber)||(/^(?:a|to|zu|do)$/u.test(previous)&&beforeNumber))continue;
  if(correction&&span.to<=correction.from)continue;
  const explicitShirt=matches(lex.shirt).some(marker=>marker.to<=span.from&&span.from-marker.to<=1)||text[tokens[span.from].start-1]==='#';
  if(match.value===1&&!explicitShirt){
   const article=({es:['un','una'],en:[],de:['ein','eine'],fr:['un','une'],it:['un','uno','una'],nl:['een'],pl:[]} as Record<Language,string[]>)[language];
   if(article.includes(keys[span.from])||/^(?:of|de|z)$/u.test(next))continue;
  }
  if(match.value===undefined){warnings.push('Hay un dorsal fuera de 0–99 o un número ambiguo; no se ha asignado.');continue;}
  numbers.push({...span,dorsal:match.value});
 }
 const relation=lex.relation[event];
 const committing:Record<Language,string>={es:'cometio|comete|hizo|hace',en:'committed|conceded|fouled',de:'verursacht|verschuldet|foul',fr:'commet|commis|faute|provoque',it:'commette|commesso|fallo',nl:'veroorzaakt|begaat|overtreding',pl:'faul|fauluje|sfaulowal|sfaulowala'};
 const recipientPreposition:Record<Language,string[]>={es:['contra','a','al'],en:['against'],de:['gegen'],fr:['contre'],it:['contro'],nl:['tegen'],pl:['przeciwko']};
 const after=relation?matches(relation.after).filter(marker=>{
  if(event!=='penalti_cometido')return true;
  if(language==='es'&&keys[marker.from]==='contra'&&keys[marker.from-1]==='en')return false;
  if(recipientPreposition[language].includes(keys[marker.from])&&marker.to-marker.from===1&&!matches(committing[language]).some(span=>span.to<=marker.from))return false;
  return true;
 }):[];
 const before=relation?matches(relation.before):[];
 const roleBarriers=event==='sustitucion'?[...outgoing,...incoming,...connectors]:after;
 [...after,...before,...(event==='sustitucion'?roleBarriers:[])].forEach(occupy);
 const stop=new Set(lex.stop.split(' '));
 const names:Entity[]=[];
 for(const player of [...players].sort((a,b)=>b.name.length-a.name.length)){
  if(!player.name.trim())continue;
  for(const span of matches(escaped(numberKey(player.name)))){
   if(names.some(name=>overlaps(name,span))||references.some(ref=>overlaps(ref,span)))continue;
   names.push({...span,nombre:raw(span)});occupy(span);
  }
 }
 // Ground unknown names in literal proper-name spans; lower-case roster names work above.
 const nameParticles=new Set(['de','del','da','di','van','von','der','la','le']);
 for(let i=0;i<tokens.length;i++){
  if(occupied.has(i)||stop.has(keys[i])||!/^\p{Lu}/u.test(tokens[i].raw)||!/^\p{L}+$/u.test(tokens[i].raw))continue;
  let end=i+1;
  while(end<tokens.length&&end-i<5&&!/[,;.!?]/u.test(text.slice(tokens[end-1].end,tokens[end].start))&&!occupied.has(end)&&(/^\p{Lu}/u.test(tokens[end].raw)||nameParticles.has(keys[end]))){
   if(stop.has(keys[end])&&!nameParticles.has(keys[end]))break;end++;
  }
  while(end>i+1&&nameParticles.has(keys[end-1]))end--;
  const span={from:i,to:end};names.push({...span,nombre:raw(span)});occupy(span);i=end-1;
 }
 const entities:Entity[]=[...names];
 for(const number of numbers){
  const nearby=names.filter(name=>Math.min(Math.abs(name.to-number.from),Math.abs(number.to-name.from))<=3&&!roleBarriers.some(marker=>marker.from>=Math.min(name.to,number.to)&&marker.to<=Math.max(name.from,number.from)));
  nearby.sort((a,b)=>Math.min(Math.abs(a.to-number.from),Math.abs(number.to-a.from))-Math.min(Math.abs(b.to-number.from),Math.abs(number.to-b.from)));
  const name=nearby[0];
  if(name&&name.dorsal===undefined){name.dorsal=number.dorsal;name.from=Math.min(name.from,number.from);name.to=Math.max(name.to,number.to);}
  else entities.push(number);
 }
 entities.sort((a,b)=>a.from-b.from);
 const cue=eventCues[0];
 if(event==='sustitucion'){
  const roles=substitutionRoles(entities,outgoing,incoming,connectors,tokens.length);
  if(roles.multiple)return empty('Hay varias acciones posibles. Registra una jugada por grabación.');
  if(roles.ambiguous){
   // Keep the event and perspective, but leave ambiguous participants for review.
   warnings.push('No se ha resuelto quién sale y quién entra. Revisa los participantes.');
  }else{
   if(roles.out?.dorsal!==undefined)proposal.dorsal=roles.out.dorsal;
   if(roles.out?.nombre)proposal.nombre=roles.out.nombre;
   if(roles.in?.dorsal!==undefined)proposal.dorsal_relacionado=roles.in.dorsal;
   if(roles.in?.nombre)proposal.nombre_relacionado=roles.in.nombre;
  }
  const teamValues=new Set(references.map(ref=>ref.team));
  if(teamValues.size===1)proposal.equipo=[...teamValues][0];
  if(proposal.equipo==='desconocido')warnings.push('Equipo sin resolver. No se ha supuesto equipo 1 ni equipo 2.');
  return {proposal,warnings:[...new Set(warnings)],eventKeyword:raw(cue),eventMatch:approximated?'approximate' as const:'literal' as const};
 }

 let primaryRegion:Span={from:0,to:tokens.length},relatedRegion:Span|undefined;
 const beforeMarker=before.find(marker=>!after.some(other=>overlaps(marker,other)&&other.to-other.from>=marker.to-marker.from)&&entities.some(entity=>entity.to<=marker.from&&marker.from-entity.to<=2));
 const afterMarker=after[0];
 if(beforeMarker){
  const subject=entities.filter(entity=>entity.to<=beforeMarker.from&&beforeMarker.from-entity.to<=2).at(-1);
  if(subject&&cue.to<=subject.from){relatedRegion={from:subject.from,to:beforeMarker.to};primaryRegion={from:0,to:subject.from};}
  else {relatedRegion={from:0,to:beforeMarker.from};primaryRegion={from:beforeMarker.to,to:tokens.length};}
 }
 else if(afterMarker){
  if(afterMarker.from<cue.from){relatedRegion={from:afterMarker.from,to:cue.from};primaryRegion={from:cue.from,to:tokens.length};}
  else {relatedRegion={from:afterMarker.from,to:tokens.length};primaryRegion={from:0,to:afterMarker.from};}
 }
 // A loss can mention the receiving opponent; it has no stored related player.
 if(event==='perdida'){
  const destination=matches(lex.destination).find(span=>span.from>cue.from&&!numbers.some(number=>overlaps(number,span))&&references.some(ref=>ref.from>=span.to));
  if(destination){primaryRegion={from:0,to:destination.from};relatedRegion={from:destination.to,to:tokens.length};}
 }
 const teamIn=(region:Span)=>{
  const values=new Set(references.filter(ref=>contains(region,ref)).map(ref=>ref.team));
  return values.size===1?[...values][0]:undefined;
 };
 const primaryTeam=teamIn(primaryRegion),otherTeam=relatedRegion?teamIn(relatedRegion):undefined;
 proposal.equipo=primaryTeam??(otherTeam?(event==='gol'?otherTeam:otherTeam==='equipo1'?'equipo2':'equipo1'):'desconocido');
 const pick=(region:Span):Entity|undefined=>{
  const values=entities.filter(entity=>contains(region,entity));
  if(values.length===1)return values[0];
  const named=values.filter(entity=>entity.nombre),numbered=values.filter(entity=>entity.dorsal!==undefined);
  if(named.length===1&&numbered.length===1)return {...named[0],dorsal:numbered[0].dorsal};
  if(values.length>1)warnings.push('Hay varios jugadores posibles en un mismo rol; revisa los participantes.');
  return undefined;
 };
 if(event!=='pasivo'){
  const primary=pick(primaryRegion);
  if(primary?.nombre)proposal.nombre=primary.nombre;
  if(primary?.dorsal!==undefined)proposal.dorsal=primary.dorsal;
  if(relatedEvents.has(event)&&relatedRegion){
   const expected=proposal.equipo==='desconocido'?undefined:event==='gol'?proposal.equipo:proposal.equipo==='equipo1'?'equipo2':'equipo1';
   if(expected&&otherTeam&&expected!==otherTeam)warnings.push('El equipo del participante relacionado no coincide con su rol. Revísalo.');
   else{const related=pick(relatedRegion);if(related?.nombre)proposal.nombre_relacionado=related.nombre;if(related?.dorsal!==undefined)proposal.dorsal_relacionado=related.dorsal;}
  }
 }
 if(proposal.equipo==='desconocido')warnings.push('Equipo sin resolver. No se ha supuesto equipo 1 ni equipo 2.');
 return {proposal,warnings:[...new Set(warnings)],eventKeyword:raw(cue),eventMatch:approximated?'approximate' as const:'literal' as const};
}
