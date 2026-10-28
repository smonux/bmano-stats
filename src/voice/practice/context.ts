import type { Snapshot } from '../../domain/schema';
import { nameKey } from '../../domain/identity';
import { tr } from '../../i18n';
import type { EventDraft } from '../../data/database';

export const practiceIds = {
  match: 'voice-practice:match',
  own: 'voice-practice:one',
  other: 'voice-practice:two',
} as const;

/** In-memory objects only. Never pass this context to a repository. */
export function practiceContext(): Snapshot {
  const base = { createdAt: 0, updatedAt: 0, deletedAt: null };
  const teams = [practiceIds.own, practiceIds.other].map((id, index) => {
    const name = tr('Equipo de práctica {number}', { number: index + 1 });
    return { ...base, id, name, nameKey: nameKey(name) };
  });
  return {
    teams,
    players: [
      { teamId: practiceIds.own, dorsal: 7, name: 'Marta' },
      { teamId: practiceIds.own, dorsal: 9, name: 'Elena' },
      { teamId: practiceIds.other, dorsal: 12, name: '' },
      { teamId: practiceIds.other, dorsal: 8, name: '' },
    ].map((player) => ({
      ...base,
      ...player,
      id: `${player.teamId}:${player.dorsal}`,
      isUnknown: false,
    })),
    matches: [
      {
        ...base,
        id: practiceIds.match,
        localTeamId: practiceIds.own,
        visitorTeamId: practiceIds.other,
        date: '2026-01-01',
        status: 'active',
        clock: { period: 1, elapsedMs: 0, startedAt: null },
      },
    ],
    events: [],
  };
}

export function emptyPracticeDraft(): EventDraft {
  return {
    matchId: practiceIds.match,
    type: null,
    teamId: null,
    primaryDorsal: '',
    relatedDorsal: '',
    period: 1,
    minute: 0,
    metadata: {},
    note: '',
    rawText: '',
  };
}
