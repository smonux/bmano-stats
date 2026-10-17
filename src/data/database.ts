import { createId } from '../domain/id';
import { exclusionRemaining } from '../domain/exclusions';
import Dexie, { type EntityTable } from 'dexie';
import {
  changeClock,
  cleanEvent,
  definitions,
  eventSchema,
  nameKey,
  relatedTeam,
  unknownId,
  validateBackup,
  type Backup,
  type GameEvent,
  type Match,
  type Player,
  type Snapshot,
  type Team,
} from '../domain/model';

export class HandballDatabase extends Dexie {
  teams!: EntityTable<Team, 'id'>;
  players!: EntityTable<Player, 'id'>;
  matches!: EntityTable<Match, 'id'>;
  events!: EntityTable<GameEvent, 'id'>;
  constructor(name = 'handball-stats-v1') {
    super(name);
    this.version(1).stores({
      teams: 'id, &nameKey',
      players: 'id, teamId, &[teamId+dorsal]',
      matches: 'id, date, status',
      events: 'id, matchId, [matchId+orderKey]',
    });
  }
  async snapshot(): Promise<Snapshot> {
    return this.transaction('r', this.tables, async () => ({
      teams: await this.teams.toArray(),
      players: await this.players.toArray(),
      matches: await this.matches.toArray(),
      events: await this.events.toArray(),
    }));
  }
}
export const db = new HandballDatabase();
export type TeamChoice = { id: string; name?: never } | { name: string; id?: never };
export type EventDraft = Omit<
  GameEvent,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'orderKey'
  | 'schemaVersion'
  | 'primaryPlayerId'
  | 'relatedPlayerId'
> & { id?: string; primaryDorsal: string; relatedDorsal: string; expectedUpdatedAt?: number };
const stamps = () => {
  const now = Date.now();
  return { createdAt: now, updatedAt: now, deletedAt: null };
};
export function repository(database = db) {
  async function makeTeam(name: string): Promise<Team> {
    name = name.trim();
    if (!name || name.length > 100)
      throw new Error('Introduce un nombre de equipo de hasta 100 caracteres.');
    const key = nameKey(name);
    if (await database.teams.where('nameKey').equals(key).first())
      throw new Error('Ya existe un equipo con ese nombre. Selecciónalo del catálogo.');
    const team: Team = { id: createId(), name, nameKey: key, ...stamps() };
    await database.teams.add(team);
    await database.players.add({
      id: unknownId(team.id),
      teamId: team.id,
      dorsal: null,
      name: 'Desconocido',
      isUnknown: true,
      ...stamps(),
    });
    return team;
  }
  async function resolvePlayer(teamId: string, value: string) {
    if (!value.trim()) return null;
    if (!/^\d{1,2}$/.test(value.trim()))
      throw new Error('El dorsal debe ser un número entre 0 y 99.');
    const dorsal = Number(value);
    const existing = await database.players
      .where('[teamId+dorsal]')
      .equals([teamId, dorsal])
      .first();
    if (existing) {
      if (existing.deletedAt !== null)
        await database.players.update(existing.id, { deletedAt: null, updatedAt: Date.now() });
      return existing.id;
    }
    if (!(await database.teams.get(teamId))) throw new Error('No se encontró el equipo.');
    const player: Player = {
      id: createId(),
      teamId,
      dorsal,
      name: '',
      isUnknown: false,
      ...stamps(),
    };
    await database.players.add(player);
    return player.id;
  }
  return {
    addTeam: (name: string) =>
      database.transaction('rw', database.teams, database.players, () => makeTeam(name)),
    async renameTeam(id: string, name: string) {
      return database.transaction('rw', database.teams, async () => {
        name = name.trim();
        if (!name || name.length > 100) throw new Error('Introduce un nombre válido.');
        const team = await database.teams.get(id);
        if (!team) throw new Error('Equipo no encontrado.');
        const duplicate = await database.teams.where('nameKey').equals(nameKey(name)).first();
        if (duplicate && duplicate.id !== id)
          throw new Error('Ya existe otro equipo con ese nombre.');
        await database.teams.update(id, { name, nameKey: nameKey(name), updatedAt: Date.now() });
      });
    },
    async savePlayer(teamId: string, dorsal: string, name: string) {
      return database.transaction('rw', database.players, database.teams, async () => {
        const id = await resolvePlayer(teamId, dorsal);
        if (!id) throw new Error('Introduce el dorsal.');
        if (name.length > 100) throw new Error('El nombre no puede superar 100 caracteres.');
        await database.players.update(id, { name: name.trim(), updatedAt: Date.now() });
      });
    },
    async createMatch(local: TeamChoice, visitor: TeamChoice, date: string) {
      return database.transaction(
        'rw',
        database.teams,
        database.players,
        database.matches,
        async () => {
          const resolve = async (choice: TeamChoice) =>
            choice.id ? database.teams.get(choice.id) : makeTeam(choice.name!);
          const a = await resolve(local),
            b = await resolve(visitor);
          if (!a || !b || a.deletedAt !== null || b.deletedAt !== null || a.id === b.id)
            throw new Error('Elige dos equipos distintos.');
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date
          )
            throw new Error('Introduce una fecha válida.');
          const match: Match = {
            id: createId(),
            localTeamId: a.id,
            visitorTeamId: b.id,
            date,
            status: 'active',
            clock: { period: 1, elapsedMs: 0, startedAt: Date.now() },
            ...stamps(),
          };
          await database.matches.add(match);
          return match;
        },
      );
    },
    async saveEvent(draft: EventDraft) {
      return database.transaction(
        'rw',
        database.events,
        database.players,
        database.matches,
        database.teams,
        async () => {
          const match = await database.matches.get(draft.matchId);
          if (!match || match.deletedAt !== null) throw new Error('Partido no disponible.');
          if (draft.period > match.clock.period)
            throw new Error('El tiempo indicado aún no existe.');
          if (draft.teamId && ![match.localTeamId, match.visitorTeamId].includes(draft.teamId))
            throw new Error('El equipo no pertenece al partido.');
          const old = draft.id ? await database.events.get(draft.id) : undefined;
          if (draft.id && (!old || old.matchId !== match.id || old.deletedAt !== null))
            throw new Error('El evento ya no está disponible.');
          if (old && draft.expectedUpdatedAt !== old.updatedAt)
            throw new Error('El evento cambió en otra ventana. Cierra y vuelve a editarlo.');
          const events = await database.events.where('matchId').equals(match.id).toArray();
          const cfg = draft.type;
          const primary =
            cfg && cfg !== 'passive' && draft.teamId
              ? await resolvePlayer(draft.teamId, draft.primaryDorsal)
              : null;
          const secondary =
            cfg && draft.teamId && definitions[cfg].related
              ? await resolvePlayer(relatedTeam(match, cfg, draft.teamId), draft.relatedDorsal)
              : null;
          const event = cleanEvent(
            eventSchema.parse({
              ...draft,
              id: old?.id ?? createId(),
              primaryPlayerId: primary,
              relatedPlayerId: secondary,
              createdAt: old?.createdAt ?? Date.now(),
              updatedAt: Math.max(Date.now(), (old?.updatedAt ?? 0) + 1),
              deletedAt: null,
              orderKey: old?.orderKey ?? Math.max(0, ...events.map((e) => e.orderKey)) + 1,
              schemaVersion: 1,
            }),
          );
          // Editing minute changes its chronological position; tie order is stable.
          await database.events.put(event);
          return event;
        },
      );
    },
    async deleteEvent(id: string) {
      await database.events.update(id, { deletedAt: Date.now(), updatedAt: Date.now() });
    },
    async clock(id: string, action: 'pause' | 'resume' | 'period' | 'finish') {
      return database.transaction('rw', database.matches, async () => {
        const match = await database.matches.get(id);
        if (!match || match.deletedAt !== null) throw new Error('Partido no disponible.');
        await database.matches.put(changeClock(match, action));
      });
    },
    async exclusion(
      id: string,
      slot: number,
      action: 'start' | 'pause' | 'resume' | 'clear',
      player?: { teamId: string; dorsal: number | null },
    ) {
      if (!Number.isInteger(slot) || slot < 0 || slot > 2)
        throw new Error('Temporizador de exclusión inválido.');
      return database.transaction('rw', database.matches, async () => {
        const match = await database.matches.get(id);
        if (!match || match.deletedAt !== null || match.status !== 'active')
          throw new Error('Partido no disponible.');
        const timers = [...(match.exclusions ?? [null, null, null])];
        const timer = timers[slot],
          now = Date.now();
        if (action === 'start') {
          if (timer) throw new Error('Libera el contador antes de usarlo de nuevo.');
          if (
            !player ||
            ![match.localTeamId, match.visitorTeamId].includes(player.teamId) ||
            (player.dorsal !== null &&
              (!Number.isInteger(player.dorsal) || player.dorsal < 0 || player.dorsal > 99))
          )
            throw new Error('Elige equipo y dorsal.');
          timers[slot] = {
            id: createId(),
            ...player,
            remainingMs: 120000,
            running: true,
            startedAt: match.clock.startedAt === null ? null : now,
          };
        } else if (action === 'clear') timers[slot] = null;
        else if (timer)
          timers[slot] = {
            ...timer,
            remainingMs: exclusionRemaining(timer, now),
            running: action === 'resume',
            startedAt:
              action === 'resume' &&
              match.clock.startedAt !== null &&
              exclusionRemaining(timer, now) > 0
                ? now
                : null,
          };
        await database.matches.update(id, { exclusions: timers, updatedAt: now });
      });
    },
    async deleteMatch(id: string) {
      return database.transaction('rw', database.matches, database.events, async () => {
        const match = await database.matches.get(id);
        if (!match) return;
        const stopped = match.status === 'active' ? changeClock(match, 'finish') : match;
        await database.matches.put({ ...stopped, deletedAt: Date.now(), updatedAt: Date.now() });
        await database.events
          .where('matchId')
          .equals(id)
          .modify({ deletedAt: Date.now(), updatedAt: Date.now() });
      });
    },
    async exportBackup(): Promise<Backup> {
      return {
        format: 'handball-stats',
        version: 1,
        exportedAt: Date.now(),
        ...(await database.snapshot()),
      };
    },
    async importBackup(input: unknown) {
      const data = validateBackup(input);
      // Explicit replacement, atomic across all stores. Never silently merge identities.
      await database.transaction('rw', database.tables, async () => {
        for (const table of database.tables) await table.clear();
        await database.teams.bulkAdd(data.teams);
        await database.players.bulkAdd(data.players);
        await database.matches.bulkAdd(data.matches);
        await database.events.bulkAdd(data.events);
      });
    },
  };
}
export const repo = repository();
