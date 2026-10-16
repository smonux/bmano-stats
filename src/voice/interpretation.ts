import { tr, type Language } from '../i18n';
import { z } from 'zod';
import { definitions, elapsed, relatedTeam, type EventType, type Match, type Snapshot } from '../domain/model';
import type { EventDraft } from '../data/database';

// Perspective is independent of the venue. Existing v1 storage keys retain their names.
export const perspectiveRule = 'Recorder perspective: own team=equipo1, opponents=equipo2, NEVER home/away. If team is not mentioned use desconocido.';
export function perspectiveFor(language: Language) {
  const words: Record<Language,string> = {
    es:'nuestro/nuestra/nosotros/mi equipo=equipo1; ellos/rival/contrario/suyo/su equipo=equipo2.',
    en:'our/us/we/my team=equipo1; they/their/opponent=equipo2.',
    de:'unser/wir/uns=equipo1; sie/ihr/Gegner=equipo2.',
    fr:'notre/nos/nous=equipo1; eux/leur/adversaire=equipo2.',
    it:'nostro/nostra/noi=equipo1; loro/avversario=equipo2.',
    nl:'ons/onze/wij=equipo1; zij/hun/tegenstander=equipo2.',
    pl:'nasz/nasza/my=equipo1; oni/ich/rywal=equipo2.',
  };
  return perspectiveRule+' '+words[language];
}
const firstTeamWords = ['our','ours','us','we','our team','my team','team1','team 1','unser','unsere','unseren','unser team','wir','uns','notre','nos','nous','notre equipe','nostro','nostra','nostri','nostre','noi','nostra squadra','ons','onze','wij','we','ons team','nasz','nasza','nasze','nasi','my','nas','nasza druzyna','equipo1','equipo 1','equipo uno','primer equipo','nuestro','nuestra','nuestros','nuestras','nosotros','nosotras','mi equipo','nuestro equipo'];
const secondTeamWords = ['they','them','their','theirs','opponent','opponents','their team','team2','team 2','sie','ihre','ihr','gegner','gegnerisch','eux','elles','leur','leurs','adversaire','adversaires','loro','avversario','avversari','avversaria','zij','ze','hun','tegenstander','tegenstanders','oni','one','ich','rywal','rywalka','przeciwnik','przeciwnicy','equipo2','equipo 2','equipo dos','segundo equipo','ellos','ellas','rival','rivales','contrario','contraria','contrarios','contrarias','suyo','suya','suyos','suyas','su equipo','el rival','equipo rival','el contrario'];

const spokenTypes = {
  gol: 'goal', parada: 'save', fallo: 'miss', perdida: 'loss', recuperacion: 'recovery',
  penalti_cometido: 'penalty', exclusion: 'exclusion', amarilla: 'yellow',
  descalificacion: 'disqualification', pasivo: 'passive', infraccion: 'infraction',
} as const satisfies Record<string, EventType>;
export const proposalSchema = z.object({
  evento: z.enum(['desconocido', ...Object.keys(spokenTypes)]),
  equipo: z.string().max(100).default(''),
  dorsal: z.number().int().min(0).max(99).optional(), nombre: z.string().max(100).default(''),
  dorsal_relacionado: z.number().int().min(0).max(99).optional(), nombre_relacionado: z.string().max(100).default(''),
  penalti: z.boolean().default(false), azul: z.boolean().default(false), infraccion: z.enum(['Pasos', 'Dobles', 'Pisando', '']).default(''),
});
export const extractionSchema = {
  type: 'object', properties: {
    evento: {type:'string',enum:[...Object.keys(spokenTypes),'desconocido'],description:'Canonical event: gol=goal, parada=goalkeeper save, fallo=missed shot, perdida=turnover, recuperacion=ball recovery, penalti_cometido=conceded penalty, exclusion=two-minute suspension, amarilla=yellow card, descalificacion=disqualification, pasivo=passive play, infraccion=rule violation. desconocido=unknown or not exactly one play.'},
    equipo: {type:'string',enum:['equipo1','equipo2','nuestro','rival','desconocido'],description:'Primary player team. '+perspectiveRule},
    dorsal: {type:'integer',minimum:0,maximum:99,description:'Primary player shirt number, only if mentioned.'},
    nombre: {type:'string',description:'Literal primary player name, only if mentioned.'},
    dorsal_relacionado: {type:'integer',minimum:0,maximum:99,description:'Shirt number of assist provider for a goal, opponent shooter for a save, or related opponent.'},
    nombre_relacionado: {type:'string',description:'Literal related player name.'},
    penalti: {type:'boolean',description:'True if the goal, save or miss is a seven-metre penalty.'},
    azul: {type:'boolean',description:'True if a blue card is mentioned.'},
    infraccion: {type:'string',enum:['Pasos','Dobles','Pisando'],description:'Violation: Pasos=steps, Dobles=double dribble, Pisando=goal area violation.'},
  }, required:['evento','equipo'], additionalProperties:false,
} as const;
export function schemaForTeams(names:string[], language:Language='es') {
  return {...extractionSchema,properties:{...extractionSchema.properties,equipo:{...extractionSchema.properties.equipo,enum:[...new Set([...extractionSchema.properties.equipo.enum,...names])],description:perspectiveFor(language)+' Team names in recorder perspective order: '+JSON.stringify({equipo1:names[0],equipo2:names[1]})}}};
}
export function selectProposal(result: {success:boolean;function_calls:{name:string;arguments:unknown}[];suppressed_calls:{name:string;arguments:unknown}[];confidence:number|null;validation?:{ungrounded?:string[];negation?:boolean}}) {
  if(!result.success || result.validation?.ungrounded?.length || result.validation?.negation) return {proposal:null,warnings:['La interpretación no está respaldada por la frase. Completa el evento a partir de la transcripción.']};
  const candidates=[...result.function_calls,...result.suppressed_calls];
  if(candidates.length!==1 || candidates[0].name!=='registrar_jugada') return {proposal:null,warnings:['Needle no ha devuelto una única propuesta. No se han supuesto los datos.']};
  // A suppressed call is only a visibly uncertain draft, never an executed action.
  return {proposal:candidates[0].arguments,warnings:['Propuesta de voz: revisa todos los campos antes de guardar.',...(result.suppressed_calls.length?['Needle ha retenido esta propuesta por incertidumbre. Solo se guardará si la confirmas.']:result.confidence!==null&&result.confidence<0.5?['El modelo indica confianza baja.']:[])]};
}
export type CaptureContext = { match: Match; data: Snapshot; period: number; minute: number };
export function captureContext(match: Match, data: Snapshot): CaptureContext {
  return {match,data,period:match.clock.period,minute:Math.min(999,Math.floor(elapsed(match.clock)/60000))};
}
export const normalize = (value: string) => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^\p{L}0-9]+/gu,' ').trim();
export function resolveTeam(reference: string, context: CaptureContext): string | null {
  const key=normalize(reference), {match,data}=context;
  if (!key) return null;
  if(firstTeamWords.includes(key)) return match.localTeamId;
  if(secondTeamWords.includes(key)) return match.visitorTeamId;
  const ids=[match.localTeamId,match.visitorTeamId];
  const matches=data.teams.filter(t=>ids.includes(t.id)&&normalize(t.name)===key);
  if(matches.length===1) return matches[0].id;
  return null;
}
export function resolveDorsal(reference: string, teamId: string | null, data: Snapshot): string {
  if(!teamId) return '';
  const key=normalize(reference);
  const number=key.match(/^(?:(?:dorsal|numero) )?(\d{1,2})$/);
  if(number) return String(Number(number[1]));
  if(!key) return '';
  const candidates=data.players.filter(p=>p.teamId===teamId&&!p.deletedAt&&!p.isUnknown&&p.name&&normalize(p.name)===key);
  return candidates.length===1?String(candidates[0].dorsal):'';
}
export function toVoiceDraft(rawText: string, proposal: unknown, context: CaptureContext): {draft: EventDraft; warnings: string[]} {
  const draft: EventDraft={matchId:context.match.id,type:null,teamId:null,primaryDorsal:'',relatedDorsal:'',period:context.period,minute:context.minute,metadata:{},note:'',rawText};
  const warnings:string[]=[];
  const parsed=proposalSchema.safeParse(proposal);
  if(!parsed.success) return {draft,warnings:['No se pudo interpretar una única jugada. Conserva la transcripción y completa el evento.']};
  const p=parsed.data;
  const principal=p.dorsal!==undefined?String(p.dorsal):p.nombre;
  const relacionado=p.dorsal_relacionado!==undefined?String(p.dorsal_relacionado):p.nombre_relacionado;
  draft.type=spokenTypes[p.evento as keyof typeof spokenTypes]??null;
  draft.teamId=resolveTeam(p.equipo,context);
  if(!draft.type) warnings.push('Tipo de evento sin resolver.');
  if(!draft.teamId) warnings.push('Equipo sin resolver. No se ha supuesto equipo 1 ni equipo 2.');
  if(draft.type && draft.type!=='passive') {
    draft.primaryDorsal=resolveDorsal(principal,draft.teamId,context.data);
    if(principal&&!draft.primaryDorsal) warnings.push(tr('«{player}» no identifica un jugador único: se atribuirá a Desconocido.',{player:principal}));
    if(definitions[draft.type].related && draft.teamId) {
      draft.relatedDorsal=resolveDorsal(relacionado,relatedTeam(context.match,draft.type,draft.teamId),context.data);
      if(relacionado&&!draft.relatedDorsal) warnings.push(tr('Participante relacionado «{player}» sin resolver.',{player:relacionado}));
    }
    if(definitions[draft.type].penalty && p.penalti) draft.metadata.penalty=true;
    if(draft.type==='disqualification'&&p.azul) draft.metadata.blue=true;
    if(draft.type==='infraction'&&p.infraccion) draft.metadata.infraction=p.infraccion;
  }
  return {draft,warnings};
}
