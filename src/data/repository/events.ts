import { createId } from '../../domain/id';
import { definitions } from '../../domain/event-definitions';
import { cleanEvent, relatedTeam } from '../../domain/events';
import { eventSchema, type Match } from '../../domain/schema';
import type { HandballDatabase } from '../connection';
import { resolvePlayerInTransaction } from './catalog';
import { availableMatch } from './match-access';
import type { EventDraft } from './types';
import { validateEventPosition } from '../../domain/event-position';

async function editableEvent(database: HandballDatabase, draft: EventDraft, matchId: string) {
  const existingEvent = draft.id ? await database.events.get(draft.id) : undefined;
  if (
    draft.id &&
    (!existingEvent || existingEvent.matchId !== matchId || existingEvent.deletedAt !== null)
  ) {
    throw new Error('El evento ya no está disponible.');
  }
  if (existingEvent && draft.expectedUpdatedAt !== existingEvent.updatedAt) {
    throw new Error('El evento cambió en otra ventana. Cierra y vuelve a editarlo.');
  }
  return existingEvent;
}

async function resolveParticipants(database: HandballDatabase, draft: EventDraft, match: Match) {
  const { type, teamId } = draft;
  const primaryPlayerId =
    type && type !== 'passive' && type !== 'note' && teamId
      ? await resolvePlayerInTransaction(database, teamId, draft.primaryDorsal)
      : null;
  const relatedPlayerId =
    type && teamId && definitions[type].related
      ? await resolvePlayerInTransaction(
          database,
          relatedTeam(match, type, teamId),
          draft.relatedDorsal,
        )
      : null;
  return { primaryPlayerId, relatedPlayerId };
}

export function eventsRepository(database: HandballDatabase) {
  return {
    async saveEvent(draft: EventDraft) {
      // Player creation/revival and the event write must commit or roll back together.
      return database.transaction(
        'rw',
        database.events,
        database.players,
        database.matches,
        database.teams,
        async () => {
          const match = await availableMatch(database, draft.matchId);
          validateEventPosition(draft, match);
          const existingEvent = await editableEvent(database, draft, match.id);
          const matchEvents = await database.events.where('matchId').equals(match.id).toArray();
          const participants = await resolveParticipants(database, draft, match);
          const event = cleanEvent(
            eventSchema.parse({
              ...draft,
              id: existingEvent?.id ?? createId(),
              ...participants,
              createdAt: existingEvent?.createdAt ?? Date.now(),
              updatedAt: Math.max(Date.now(), (existingEvent?.updatedAt ?? 0) + 1),
              deletedAt: null,
              orderKey:
                existingEvent?.orderKey ??
                Math.max(0, ...matchEvents.map((event) => event.orderKey)) + 1,
              schemaVersion: 1,
            }),
          );
          // Correcting minute changes chronological position; insertion order breaks ties.
          await database.events.put(event);
          const keeperSelected =
            event.type === 'save' &&
            event.teamId &&
            event.primaryPlayerId &&
            (!existingEvent ||
              existingEvent.type !== 'save' ||
              existingEvent.primaryPlayerId !== event.primaryPlayerId ||
              existingEvent.teamId !== event.teamId);
          if (keeperSelected && event.teamId && event.primaryPlayerId) {
            const keeper = await database.players.get(event.primaryPlayerId);
            if (keeper && !keeper.isUnknown) {
              await database.players.update(keeper.id, {
                isGoalkeeper: true,
                updatedAt: Math.max(Date.now(), keeper.updatedAt + 1),
              });
              await database.matches.update(match.id, {
                lastGoalkeepers: { ...match.lastGoalkeepers, [event.teamId]: keeper.id },
                updatedAt: Date.now(),
              });
            }
          }
          return event;
        },
      );
    },
    async deleteEvent(eventId: string) {
      await database.events.update(eventId, { deletedAt: Date.now(), updatedAt: Date.now() });
    },
  };
}
