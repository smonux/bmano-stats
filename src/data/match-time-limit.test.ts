import 'fake-indexeddb/auto';
import { afterEach, expect, test, vi } from 'vitest';
import { HandballDatabase, repository } from './database';
import { MATCH_TIME_LIMIT_MS } from '../domain/clock';
import { validateBackup } from '../domain/backup';
import { reportFixture } from '../../tests/fixtures/report';

const databases: HandballDatabase[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const database of databases.splice(0)) await database.delete();
});

test('automatic finishing is atomic and idempotent across callers, preserves events, reload and backup', async () => {
  const database = new HandballDatabase(crypto.randomUUID());
  databases.push(database);
  const repo = repository(database);
  const data = reportFixture();
  const match = data.matches[0];
  const base = 100000;
  match.clock = { period: 2, elapsedMs: MATCH_TIME_LIMIT_MS - 30000, startedAt: base };
  match.exclusions![0] = { ...match.exclusions![0]!, remainingMs: 120000, startedAt: base };
  data.matches.push(
    { ...match, id: 'paused', clock: { ...match.clock, startedAt: null }, exclusions: undefined },
    { ...match, id: 'deleted', deletedAt: 1, exclusions: undefined },
    {
      ...match,
      id: 'earlier',
      clock: { period: 1, elapsedMs: 0, startedAt: base },
      exclusions: undefined,
    },
  );
  vi.spyOn(Date, 'now').mockReturnValue(base + 29999);
  await repo.importBackup(data);
  expect(await repo.finishExpiredMatches()).toBe(0);
  const before = await database.snapshot();
  vi.spyOn(Date, 'now').mockReturnValue(base + 600000);
  expect(await Promise.all([repo.finishExpiredMatches(), repo.finishExpiredMatches()])).toEqual([
    1, 0,
  ]);
  const after = await database.snapshot();
  expect(after.teams).toEqual(before.teams);
  expect(after.players).toEqual(before.players);
  expect(after.events).toEqual(before.events);
  for (const id of ['paused', 'deleted', 'earlier'])
    expect(after.matches.find((match) => match.id === id)).toEqual(
      before.matches.find((match) => match.id === id),
    );
  expect(await database.matches.get(match.id)).toMatchObject({
    status: 'done',
    clock: { period: 2, elapsedMs: MATCH_TIME_LIMIT_MS, startedAt: null },
    exclusions: [
      { ...match.exclusions![0], remainingMs: 90000, startedAt: null, running: false },
      null,
      null,
      null,
    ],
  });
  database.close();
  await database.open();
  const backup = await repo.exportBackup();
  expect(validateBackup(backup)).toEqual(backup);
  await repo.importBackup(JSON.parse(JSON.stringify(backup)));
  expect(await database.snapshot()).toEqual(after);
  expect(await repo.finishExpiredMatches()).toBe(0);
});

test('a manual new-period request at the deadline cannot evade automatic finishing', async () => {
  const database = new HandballDatabase(crypto.randomUUID());
  databases.push(database);
  const repo = repository(database);
  const data = reportFixture();
  data.matches[0].clock.elapsedMs = MATCH_TIME_LIMIT_MS;
  await repo.importBackup(data);
  await repo.clock(data.matches[0].id, 'period');
  expect(await database.matches.get(data.matches[0].id)).toMatchObject({
    status: 'done',
    clock: { period: 2, elapsedMs: MATCH_TIME_LIMIT_MS, startedAt: null },
  });
});
