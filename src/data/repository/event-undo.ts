import type { GameEvent, Player } from '../../domain/schema';
import type { HandballDatabase } from '../connection';
import { availableMatch } from './match-access';
import type { EventDraft } from './types';

type PlayerChange = { before?: Player; after: Player };
/** An ephemeral receipt for one creation. Never serialized into matches or backups. */
export type EventUndo = {
  event: GameEvent;
  players: PlayerChange[];
  references: { id: string; updatedAt: number }[];
  keeper?: { teamId: string; before?: string; after: string; hadMap: boolean };
};

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const conflict = () =>
  new Error('No se puede deshacer: la jugada o sus jugadores han cambiado. Revisa el registro.');

function references(events: GameEvent[], ids: Set<string>, except: string) {
  return events
    .filter(
      (event) =>
        event.id !== except &&
        (ids.has(event.primaryPlayerId ?? '') || ids.has(event.relatedPlayerId ?? '')),
    )
    .map(({ id, updatedAt }) => ({ id, updatedAt }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function eventUndoRepository(
  database: HandballDatabase,
  save: (draft: EventDraft) => Promise<GameEvent>,
) {
  return {
    async createEventWithUndo(draft: EventDraft): Promise<{ event: GameEvent; undo: EventUndo }> {
      if (draft.id) throw new Error('Deshacer solo está disponible para una jugada nueva.');
      return database.transaction(
        'rw',
        database.events,
        database.players,
        database.matches,
        database.teams,
        async () => {
          const beforeMatch = await availableMatch(database, draft.matchId);
          const beforePlayers = await database.players
            .where('teamId')
            .anyOf([beforeMatch.localTeamId, beforeMatch.visitorTeamId])
            .toArray();
          // The nested save shares this transaction: receipt and all effects commit together.
          const event = await save(draft);
          const ids = [
            ...new Set(
              [event.primaryPlayerId, event.relatedPlayerId].filter((id): id is string => !!id),
            ),
          ];
          const afterPlayers = await database.players.bulkGet(ids);
          const players = afterPlayers.flatMap((after) => {
            if (!after) return [];
            const before = beforePlayers.find((player) => player.id === after.id);
            return same(before, after) ? [] : [{ before, after }];
          });
          const afterMatch = await availableMatch(database, draft.matchId);
          const teamId = event.teamId;
          const afterKeeper = teamId ? afterMatch.lastGoalkeepers?.[teamId] : undefined;
          const beforeKeeper = teamId ? beforeMatch.lastGoalkeepers?.[teamId] : undefined;
          const changedIds = new Set(players.map((change) => change.after.id));
          const undo: EventUndo = {
            event,
            players,
            references: players.length
              ? references(await database.events.toArray(), changedIds, event.id)
              : [],
            keeper:
              teamId &&
              afterKeeper &&
              (afterKeeper !== beforeKeeper ||
                players.some((change) => change.after.id === afterKeeper))
                ? {
                    teamId,
                    before: beforeKeeper,
                    after: afterKeeper,
                    hadMap: beforeMatch.lastGoalkeepers !== undefined,
                  }
                : undefined,
          };
          return { event, undo };
        },
      );
    },
    async undoEventCreation(receipt: EventUndo) {
      return database.transaction(
        'rw',
        database.events,
        database.players,
        database.matches,
        async () => {
          const match = await availableMatch(database, receipt.event.matchId);
          if (!same(await database.events.get(receipt.event.id), receipt.event)) throw conflict();
          for (const change of receipt.players) {
            if (!same(await database.players.get(change.after.id), change.after)) throw conflict();
          }
          const changedIds = new Set(receipt.players.map((change) => change.after.id));
          if (
            !same(
              references(await database.events.toArray(), changedIds, receipt.event.id),
              receipt.references,
            )
          )
            throw conflict();
          const keeper = receipt.keeper;
          if (keeper && match.lastGoalkeepers?.[keeper.teamId] !== keeper.after) throw conflict();
          // A newly created player cannot be removed if another match now remembers them.
          const newIds = new Set(
            receipt.players.filter((change) => !change.before).map((change) => change.after.id),
          );
          const otherMatches = await database.matches.toArray();
          if (
            otherMatches.some((other) =>
              Object.entries(other.lastGoalkeepers ?? {}).some(
                ([teamId, id]) =>
                  newIds.has(id) && !(other.id === match.id && teamId === keeper?.teamId),
              ),
            )
          )
            throw conflict();
          if (keeper) {
            const lastGoalkeepers = { ...match.lastGoalkeepers };
            if (keeper.before) lastGoalkeepers[keeper.teamId] = keeper.before;
            else delete lastGoalkeepers[keeper.teamId];
            await database.matches.put({
              ...match,
              lastGoalkeepers:
                Object.keys(lastGoalkeepers).length || keeper.hadMap ? lastGoalkeepers : undefined,
              updatedAt: Math.max(Date.now(), match.updatedAt + 1),
            });
          }
          // Undo removes this creation, unlike ordinary logical deletion. No dangling player refs.
          await database.events.delete(receipt.event.id);
          for (const change of receipt.players) {
            if (change.before) await database.players.put(change.before);
            else await database.players.delete(change.after.id);
          }
        },
      );
    },
  };
}
