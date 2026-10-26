import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, expect, test, vi } from 'vitest';
import { HandballDatabase, repository } from './database';
import { reportFixture } from '../../tests/fixtures/report';
import { validateBackup } from '../domain/backup';
import { exclusionRemaining } from '../domain/exclusions';
import { migrateLegacyExclusions } from '../domain/legacy-exclusions';

const databases: HandballDatabase[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const db of databases.splice(0)) await db.delete();
});
function legacy() {
  const data = reportFixture();
  const match = data.matches[0];
  match.clock.startedAt = 10000;
  const timer = match.exclusions![0]!;
  match.exclusions = [
    { ...timer, remainingMs: 120000, running: true, startedAt: 20000 },
    { ...timer, id: 'paused', dorsal: 0, remainingMs: 90000, running: false, startedAt: null },
    null,
  ];
  return { ...data, version: 1 as const, exportedAt: 100000 };
}
test('legacy timers retain remaining time and join the common clock without mutating input', () => {
  const data = legacy(),
    before = structuredClone(data);
  const migrated = migrateLegacyExclusions(data.matches[0], 100000);
  expect(migrated.exclusions).toHaveLength(4);
  expect(migrated.exclusions![0]).toMatchObject({
    remainingMs: 40000,
    running: true,
    startedAt: 100000,
  });
  expect(migrated.exclusions![1]).toMatchObject({
    dorsal: 0,
    remainingMs: 90000,
    running: true,
    startedAt: 100000,
  });
  expect(migrated.clock).toEqual(before.matches[0].clock);
  expect(data).toEqual(before);
  expect(migrateLegacyExclusions(migrated, 110000)).toBe(migrated);
  const paused = migrateLegacyExclusions(
    { ...data.matches[0], clock: { ...data.matches[0].clock, startedAt: null } },
    100000,
  );
  expect(paused.exclusions![1]).toMatchObject({
    remainingMs: 90000,
    running: true,
    startedAt: null,
  });
  const done = migrateLegacyExclusions(
    { ...data.matches[0], status: 'done', clock: { ...data.matches[0].clock, startedAt: null } },
    100000,
  );
  expect(done.exclusions![1]).toMatchObject({
    remainingMs: 90000,
    running: false,
    startedAt: null,
  });
});
test('v1 backup imports as v2, preserves statistics and rejects malformed legacy data before conversion', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(100000);
  const data = legacy();
  const converted = validateBackup(data);
  expect(converted.version).toBe(2);
  expect(converted.events).toEqual(data.events);
  expect(converted.players).toEqual(data.players);
  expect(converted.matches[0].exclusions).toHaveLength(4);
  const db = new HandballDatabase(crypto.randomUUID());
  databases.push(db);
  const repo = repository(db);
  await repo.importBackup(data);
  const backup = await repo.exportBackup();
  for (const key of ['teams', 'players', 'matches', 'events'] as const)
    expect(backup[key]).toEqual([...converted[key]].sort((a, b) => a.id.localeCompare(b.id)));
  expect(backup.version).toBe(2);
  await repo.importBackup(JSON.parse(JSON.stringify(backup)));
  const bad = legacy();
  bad.matches[0].exclusions![1]!.startedAt = 1000;
  expect(() => validateBackup(bad)).toThrow('Temporizador');
  const extra = legacy();
  extra.matches[0].exclusions!.push(null);
  expect(() => validateBackup(extra)).toThrow();
  const unsupported = { ...converted, version: 3 };
  expect(() => validateBackup(unsupported)).toThrow();
});
test('opening an existing IndexedDB upgrades three slots once while retaining every collection', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(100000);
  const name = crypto.randomUUID(),
    old = new Dexie(name),
    data = legacy();
  old.version(1).stores({
    teams: 'id, &nameKey',
    players: 'id, teamId, &[teamId+dorsal]',
    matches: 'id, date, status',
    events: 'id, matchId, [matchId+orderKey]',
  });
  await old.open();
  for (const key of ['teams', 'players', 'matches', 'events'] as const)
    await old.table(key).bulkAdd(data[key]);
  old.close();
  const db = new HandballDatabase(name);
  databases.push(db);
  await db.open();
  const snapshot = await db.snapshot();
  expect(snapshot.events).toEqual([...data.events].sort((a, b) => a.id.localeCompare(b.id)));
  expect(snapshot.players).toHaveLength(data.players.length);
  expect(snapshot.teams).toHaveLength(data.teams.length);
  expect(snapshot.matches[0].exclusions).toHaveLength(4);
  expect(snapshot.matches[0].clock).toEqual(data.matches[0].clock);
  expect(snapshot.matches[0].exclusions![1]).toMatchObject({
    remainingMs: 90000,
    startedAt: 100000,
    running: true,
  });
  db.close();
  vi.spyOn(Date, 'now').mockReturnValue(101000);
  await db.open();
  const reloaded = (await db.snapshot()).matches[0];
  expect(reloaded.exclusions).toEqual(snapshot.matches[0].exclusions);
  expect(exclusionRemaining(reloaded.exclusions![1]!)).toBe(89000);
});
