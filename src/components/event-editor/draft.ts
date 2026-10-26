import type { EventDraft } from '../../data/database';
import type { GameEvent, Match, Snapshot } from '../../domain/schema';
import { elapsed } from '../../domain/clock';

export function createEditorDraft(data: Snapshot, match: Match, event?: GameEvent): EventDraft {
  const shirtNumberForPlayer = (id: string | null) =>
    data.players.find((candidatePlayer) => candidatePlayer.id === id)?.dorsal?.toString() ?? '';
  return {
    id: event?.id,
    expectedUpdatedAt: event?.updatedAt,
    matchId: match.id,
    type: event?.type ?? null,
    teamId: event ? event.teamId : match.localTeamId,
    primaryDorsal: shirtNumberForPlayer(event?.primaryPlayerId ?? null),
    relatedDorsal: shirtNumberForPlayer(event?.relatedPlayerId ?? null),
    minute: event?.minute ?? Math.min(999, Math.floor(elapsed(match.clock) / 60000)),
    period: event?.period ?? match.clock.period,
    metadata: event?.metadata ?? {},
    note: event?.note ?? '',
    rawText: event?.rawText ?? '',
  };
}
