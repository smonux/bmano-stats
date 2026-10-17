import type { Backup, GameEvent } from '../../src/domain/model';
export function reportFixture(): Backup {
  const base = { createdAt: 1, updatedAt: 1, deletedAt: null };
  const event = (
    id: string,
    period: number,
    minute: number,
    type: GameEvent['type'],
    teamId: string | null,
    player: string | null,
    extra: Partial<GameEvent> = {},
  ): GameEvent => ({
    ...base,
    id,
    matchId: 'report-match',
    schemaVersion: 1,
    period,
    minute,
    type,
    teamId,
    primaryPlayerId: player,
    relatedPlayerId: null,
    orderKey: Number(id.slice(1)),
    metadata: {},
    note: '',
    rawText: '',
    ...extra,
  });
  return {
    format: 'handball-stats',
    version: 1,
    exportedAt: Date.now(),
    teams: [
      { ...base, id: 'a', name: 'La Jota', nameKey: 'la jota' },
      { ...base, id: 'b', name: 'Rival', nameKey: 'rival' },
    ],
    players: [
      { ...base, id: 'unknown:a', teamId: 'a', name: 'Desconocido', dorsal: null, isUnknown: true },
      { ...base, id: 'unknown:b', teamId: 'b', name: 'Desconocido', dorsal: null, isUnknown: true },
      { ...base, id: 'a7', teamId: 'a', name: 'Ana Łukasz', dorsal: 7, isUnknown: false },
      { ...base, id: 'a1', teamId: 'a', name: 'Íker', dorsal: 1, isUnknown: false },
      { ...base, id: 'b9', teamId: 'b', name: 'Zoë', dorsal: 9, isUnknown: false },
    ],
    matches: [
      {
        ...base,
        id: 'report-match',
        localTeamId: 'a',
        visitorTeamId: 'b',
        date: '2026-10-16',
        status: 'active',
        clock: { period: 2, elapsedMs: 540000, startedAt: null },
        exclusions: [
          {
            id: 'timer',
            teamId: 'a',
            dorsal: null,
            remainingMs: 60000,
            running: false,
            startedAt: null,
          },
          null,
          null,
        ],
      },
    ],
    events: [
      event('e8', 2, 6, 'infraction', 'a', 'a7', { metadata: { infraction: 'Pasos' } }),
      event('e3', 1, 4, 'goal', 'a', 'a7'),
      event('e1', 1, 3, 'goal', 'a', 'a7', { rawText: 'Gol nuestro dorsal siete' }),
      event('e2', 1, 1, 'goal', 'b', 'b9'),
      event('e5', 2, 4, 'goal', 'b', 'b9'),
      event('e4', 2, 2, 'goal', 'a', 'a7', { metadata: { penalty: true } }),
      event('e6', 1, 5, 'save', 'a', 'a1', { relatedPlayerId: 'b9' }),
      event('e7', 2, 5, 'loss', 'b', 'b9'),
      event('e9', 2, 7, null, null, null),
    ],
  };
}
