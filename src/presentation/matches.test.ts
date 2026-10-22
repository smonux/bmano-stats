import { expect, test } from 'vitest';
import { lastOurTeam } from './matches';
import type { Snapshot, Match } from '../domain/model';
const base = { createdAt: 1, updatedAt: 1, deletedAt: null };
const match = (id: string, team: string, createdAt: number, date: string): Match => ({
  ...base,
  id,
  localTeamId: team,
  visitorTeamId: 'rival',
  createdAt,
  date,
  status: 'done',
  clock: { period: 1, elapsedMs: 0, startedAt: null },
});
test('last our team follows successful match creation, independent of date, and excludes archived data', () => {
  const data: Snapshot = {
    teams: ['a', 'b', 'c'].map((id) => ({ ...base, id, name: id, nameKey: id })),
    players: [],
    events: [],
    matches: [match('older', 'a', 1, '2026-12-01'), match('newer', 'b', 2, '2026-01-01')],
  };
  expect(lastOurTeam(data)).toBe('b');
  data.matches.push({ ...match('deleted', 'c', 3, '2026-10-22'), deletedAt: 4 });
  expect(lastOurTeam(data)).toBe('b');
  data.teams[1].deletedAt = 4;
  expect(lastOurTeam(data)).toBe('a');
  data.teams[0].deletedAt = 4;
  expect(lastOurTeam(data)).toBe('');
  expect(lastOurTeam({ ...data, matches: [] })).toBe('');
});
