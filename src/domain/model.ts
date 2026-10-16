import { syncExclusions } from './exclusions';
import { z } from 'zod';

export const eventTypes = ['goal', 'save', 'miss', 'loss', 'recovery', 'penalty', 'exclusion', 'yellow', 'disqualification', 'passive', 'infraction'] as const;
export type EventType = typeof eventTypes[number];
export const definitions: Record<EventType, { label: string; icon: string; principal: string; related?: string; sameTeam?: boolean; penalty?: boolean }> = {
  goal: { label: 'Gol', icon: '●', principal: 'Goleador', related: 'Asistente', sameTeam: true, penalty: true },
  save: { label: 'Parada', icon: '◇', principal: 'Portero', related: 'Lanzador rival', penalty: true },
  miss: { label: 'Lanzamiento fallado', icon: '↗', principal: 'Lanzador', penalty: true },
  loss: { label: 'Pérdida', icon: '↓', principal: 'Responsable' },
  recovery: { label: 'Recuperación', icon: '↑', principal: 'Recuperador', related: 'Rival que pierde' },
  penalty: { label: 'Penalti cometido', icon: '◎', principal: 'Infractor', related: 'Beneficiario rival' },
  exclusion: { label: 'Exclusión', icon: 'Ⅱ', principal: 'Excluido', related: 'Provocador rival' },
  yellow: { label: 'Tarjeta amarilla', icon: '▣', principal: 'Amonestado' },
  disqualification: { label: 'Descalificación', icon: '▣', principal: 'Descalificado', related: 'Provocador rival' },
  passive: { label: 'Pasivo', icon: '◷', principal: 'No aplica' },
  infraction: { label: 'Infracción', icon: '!', principal: 'Infractor' },
};
const id = z.string().min(1).max(100);
const stamp = z.number().finite().nonnegative();
const base = { id, createdAt: stamp, updatedAt: stamp, deletedAt: stamp.nullable() };
export const teamSchema = z.object({ ...base, name: z.string().trim().min(1).max(100), nameKey: z.string().min(1) });
export const playerSchema = z.object({ ...base, teamId: id, dorsal: z.number().int().min(0).max(99).nullable(), name: z.string().max(100), isUnknown: z.boolean() });
export const clockSchema = z.object({ period: z.number().int().min(1), elapsedMs: stamp, startedAt: stamp.nullable() });
export const exclusionSchema = z.object({ id, teamId: id, dorsal: z.number().int().min(0).max(99), remainingMs: z.number().min(0).max(120000), running: z.boolean(), startedAt: stamp.nullable() });
export const matchSchema = z.object({ ...base, localTeamId: id, visitorTeamId: id, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(['active', 'done']), clock: clockSchema, exclusions: z.array(exclusionSchema.nullable()).length(3).optional() });
export const metadataSchema = z.object({ penalty: z.boolean().optional(), blue: z.boolean().optional(), infraction: z.enum(['Pasos', 'Dobles', 'Pisando']).optional() });
export const eventSchema = z.object({ ...base, schemaVersion: z.literal(1), matchId: id, type: z.enum(eventTypes).nullable(), teamId: id.nullable(), primaryPlayerId: id.nullable(), relatedPlayerId: id.nullable(), period: z.number().int().min(1), minute: z.number().int().min(0).max(999), orderKey: z.number().int().nonnegative(), metadata: metadataSchema, rawText: z.string().max(10000), note: z.string().max(10000) });
export type Team = z.infer<typeof teamSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Match = z.infer<typeof matchSchema>;
export type Clock = z.infer<typeof clockSchema>;
export type GameEvent = z.infer<typeof eventSchema>;
export type Snapshot = { teams: Team[]; players: Player[]; matches: Match[]; events: GameEvent[] };
export const backupSchema = z.object({ format: z.literal('handball-stats'), version: z.literal(1), exportedAt: stamp, teams: z.array(teamSchema), players: z.array(playerSchema), matches: z.array(matchSchema), events: z.array(eventSchema) });
export type Backup = z.infer<typeof backupSchema>;
export const unknownId = (teamId: string) => `unknown:${teamId}`;
export const nameKey = (name: string) => name.trim().normalize('NFKC').toLocaleLowerCase('es');
export const opponent = (match: Match, teamId: string) => match.localTeamId === teamId ? match.visitorTeamId : match.localTeamId;
export const relatedTeam = (match: Match, type: EventType, teamId: string) => definitions[type].sameTeam ? teamId : opponent(match, teamId);
export const chronological = (a: GameEvent, b: GameEvent) => a.period - b.period || a.minute - b.minute || a.orderKey - b.orderKey || a.id.localeCompare(b.id);

export function cleanEvent(event: GameEvent): GameEvent {
  const cfg = event.type ? definitions[event.type] : null;
  const metadata: GameEvent['metadata'] = {};
  if (cfg?.penalty && event.metadata.penalty !== undefined) metadata.penalty = event.metadata.penalty;
  if (event.type === 'disqualification' && event.metadata.blue !== undefined) metadata.blue = event.metadata.blue;
  if (event.type === 'infraction' && event.metadata.infraction) metadata.infraction = event.metadata.infraction;
  return { ...event, metadata, primaryPlayerId: event.type === 'passive' || !cfg || !event.teamId ? null : event.primaryPlayerId, relatedPlayerId: cfg?.related && event.teamId ? event.relatedPlayerId : null };
}

export function eventIssues(event: GameEvent, match: Match, players: Player[]): string[] {
  const issues: string[] = [];
  if (!event.type) issues.push('Selecciona un evento');
  if (!event.teamId || ![match.localTeamId, match.visitorTeamId].includes(event.teamId)) issues.push('Selecciona un equipo');
  if (event.type === 'infraction' && !event.metadata.infraction) issues.push('Selecciona el tipo de infracción');
  if (event.primaryPlayerId && !players.some(p => p.id === event.primaryPlayerId && p.teamId === event.teamId)) issues.push('Jugador principal de otro equipo');
  if (event.relatedPlayerId && event.type && event.teamId && !players.some(p => p.id === event.relatedPlayerId && p.teamId === relatedTeam(match, event.type!, event.teamId!))) issues.push('Jugador relacionado de otro equipo');
  return issues;
}
export function eventState(event: GameEvent, match: Match, players: Player[]) {
  if (event.deletedAt !== null) return 'deleted';
  if (eventIssues(event, match, players).length) return 'pending';
  if (event.type !== 'passive' && (!event.primaryPlayerId || players.find(p => p.id === event.primaryPlayerId)?.isUnknown)) return 'unidentified';
  return 'valid';
}
export const elapsed = (clock: Clock, now = Date.now()) => clock.elapsedMs + (clock.startedAt === null ? 0 : Math.max(0, now - clock.startedAt));
export function changeClock(match: Match, action: 'pause' | 'resume' | 'period' | 'finish', now = Date.now()): Match {
  if (match.status === 'done') throw new Error('El partido ha finalizado. Puedes corregir sus eventos, pero el reloj está detenido.');
  let clock = { ...match.clock };
  if (action === 'resume' && clock.startedAt === null) clock.startedAt = now;
  if (action === 'pause' || action === 'finish') clock = { ...clock, elapsedMs: elapsed(clock, now), startedAt: null };
  if (action === 'period') clock = { period: clock.period + 1, elapsedMs: 0, startedAt: now };
  return { ...match, exclusions: syncExclusions(match, clock.startedAt !== null, now, action === 'finish'), clock, status: action === 'finish' ? 'done' : 'active', updatedAt: now };
}

export function validateBackup(input: unknown): Backup {
  const data = backupSchema.parse(input);
  for (const collection of [data.teams, data.players, data.matches, data.events]) if (new Set(collection.map(x => x.id)).size !== collection.length) throw new Error('La copia contiene identificadores duplicados.');
  const teams = new Map(data.teams.map(t => [t.id, t]));
  const players = new Map(data.players.map(p => [p.id, p]));
  const matches = new Map(data.matches.map(m => [m.id, m]));
  const keys = new Set<string>();
  for (const t of data.teams) {
    if (t.nameKey !== nameKey(t.name) || keys.has(t.nameKey)) throw new Error('Los nombres de equipo no son únicos o válidos.');
    keys.add(t.nameKey);
    const u = players.get(unknownId(t.id));
    if (!u?.isUnknown || u.teamId !== t.id || u.dorsal !== null || u.deletedAt !== null) throw new Error('Falta el jugador virtual de un equipo.');
  }
  keys.clear();
  for (const p of data.players) {
    if (!teams.has(p.teamId) || (p.isUnknown ? p.id !== unknownId(p.teamId) || p.dorsal !== null : p.dorsal === null)) throw new Error('Jugador o equipo inválido en la copia.');
    const key = `${p.teamId}:${p.dorsal}`;
    if (keys.has(key)) throw new Error('La copia contiene dorsales duplicados.');
    keys.add(key);
  }
  for (const m of data.matches) {
    for (const timer of m.exclusions ?? []) if (timer && (![m.localTeamId,m.visitorTeamId].includes(timer.teamId) || (timer.startedAt !== null && (!timer.running || m.clock.startedAt === null || m.status === 'done')))) throw new Error('Temporizador de exclusión inválido.');
    if (!teams.has(m.localTeamId) || !teams.has(m.visitorTeamId) || m.localTeamId === m.visitorTeamId || (m.status === 'done' && m.clock.startedAt !== null)) throw new Error('Partido inválido en la copia.');
    if (new Date(m.date + 'T12:00:00Z').toISOString().slice(0, 10) !== m.date) throw new Error('Fecha de partido inválida.');
  }
  for (const e of data.events) {
    const m = matches.get(e.matchId);
    if (!m || (e.teamId !== null && ![m.localTeamId, m.visitorTeamId].includes(e.teamId))) throw new Error('Evento con referencias inválidas.');
    if (e.period > m.clock.period) throw new Error('Evento fuera de los tiempos del partido.');
    if (e.primaryPlayerId && players.get(e.primaryPlayerId)?.teamId !== e.teamId) throw new Error('Jugador principal inválido.');
    if (e.relatedPlayerId && (!e.type || !e.teamId || players.get(e.relatedPlayerId)?.teamId !== relatedTeam(m, e.type, e.teamId))) throw new Error('Jugador relacionado inválido.');
    const clean = cleanEvent(e);
    if (JSON.stringify(clean.metadata) !== JSON.stringify(e.metadata) || clean.primaryPlayerId !== e.primaryPlayerId || clean.relatedPlayerId !== e.relatedPlayerId) throw new Error('Evento con campos incompatibles.');
  }
  return data;
}
