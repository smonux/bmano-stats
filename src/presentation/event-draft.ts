import type { EventDraft } from '../data/database';
import { eventIssues, relatedTeam } from '../domain/events';
import type { GameEvent, Match, Player } from '../domain/schema';

/** Preview the same domain validation without creating players or writing an event. */
export function eventDraftIssues(draft: EventDraft, match: Match, players: Player[]): string[] {
  const previewPlayers = [...players];
  const playerId = (teamId: string | null, dorsal: string) => {
    if (!teamId || dorsal === '') return null;
    const existing = players.find(
      (player) => player.teamId === teamId && player.dorsal === Number(dorsal),
    );
    if (existing) return existing.id;
    const id = `preview:${teamId}:${Number(dorsal)}`;
    previewPlayers.push({
      id,
      teamId,
      dorsal: Number(dorsal),
      name: '',
      isUnknown: false,
      createdAt: 0,
      updatedAt: 0,
      deletedAt: null,
    });
    return id;
  };
  const preview: GameEvent = {
    ...draft,
    id: 'preview',
    schemaVersion: 1,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    orderKey: 0,
    primaryPlayerId: playerId(draft.teamId, draft.primaryDorsal),
    relatedPlayerId: playerId(
      draft.type && draft.teamId ? relatedTeam(match, draft.type, draft.teamId) : null,
      draft.relatedDorsal,
    ),
  };
  return eventIssues(preview, match, previewPlayers);
}
