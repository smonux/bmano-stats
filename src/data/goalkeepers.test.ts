import 'fake-indexeddb/auto';
import { beforeEach, afterEach, expect, test } from 'vitest';
import { HandballDatabase, repository, type EventDraft } from './database';
import type { Match } from '../domain/schema';
import { lastGoalkeeper } from '../domain/goalkeepers';
let db: HandballDatabase;
let repo: ReturnType<typeof repository>;
let match: Match;
beforeEach(async () => {
  db = new HandballDatabase(crypto.randomUUID());
  repo = repository(db);
  match = await repo.createMatch({ name: 'La Jota' }, { name: 'Rival' }, '2026-10-22');
});
afterEach(async () => {
  await db.delete();
});
const draft = (shirt: string, extra: Partial<EventDraft> = {}): EventDraft => ({
  matchId: match.id,
  type: 'save',
  teamId: match.localTeamId,
  primaryDorsal: shirt,
  relatedDorsal: '',
  period: 1,
  minute: 1,
  metadata: {},
  note: '',
  rawText: '',
  ...extra,
});
test('saving a save marks only its goalkeeper and remembers selections separately for each team', async () => {
  const first = await repo.saveEvent(draft('1', { relatedDorsal: '9' }));
  expect((await db.players.get(first.relatedPlayerId!))?.isGoalkeeper).toBeUndefined();
  const second = await repo.saveEvent(draft('0'));
  await repo.saveEvent(draft('9', { teamId: match.visitorTeamId }));
  await repo.saveEvent(
    draft('1', {
      id: first.id,
      expectedUpdatedAt: first.updatedAt,
      note: 'Solo una corrección de nota',
    }),
  );
  const data = await db.snapshot();
  expect(lastGoalkeeper(data.matches[0], data.players, match.localTeamId)?.dorsal).toBe(0);
  expect(lastGoalkeeper(data.matches[0], data.players, match.visitorTeamId)?.dorsal).toBe(9);
  expect(data.players.find((player) => player.id === second.primaryPlayerId)?.isGoalkeeper).toBe(
    true,
  );
  expect(
    data.players.find((player) => player.teamId === match.localTeamId && player.dorsal === 1)
      ?.isGoalkeeper,
  ).toBe(true);
  expect(data.events).toHaveLength(3);
});
test('unknown players and failed saves cannot set a goalkeeper or create partial data', async () => {
  await repo.saveEvent(draft(''));
  await expect(repo.saveEvent(draft('7', { period: 9 }))).rejects.toThrow('aún no existe');
  const data = await db.snapshot();
  expect(data.matches[0].lastGoalkeepers).toBeUndefined();
  expect(data.players.some((player) => player.isGoalkeeper)).toBe(false);
  expect(data.players.some((player) => player.dorsal === 7)).toBe(false);
});
test('roles and remembered keepers survive backups, accept old copies, and reject foreign/virtual references', async () => {
  const saved = await repo.saveEvent(draft('0'));
  const backup = await repo.exportBackup();
  await repo.importBackup(backup);
  expect(
    lastGoalkeeper((await db.matches.get(match.id))!, await db.players.toArray(), match.localTeamId)
      ?.dorsal,
  ).toBe(0);
  await repo.savePlayer(match.localTeamId, '0', 'Ana', false);
  expect(
    lastGoalkeeper(
      (await db.matches.get(match.id))!,
      await db.players.toArray(),
      match.localTeamId,
    ),
  ).toBeUndefined();
  await repo.savePlayer(match.localTeamId, '0', 'Ana', true);
  await repo.savePlayer(match.localTeamId, '0', 'Ana corregida');
  expect((await db.players.get(saved.primaryPlayerId!))?.isGoalkeeper).toBe(true);
  const invalid = structuredClone(backup);
  invalid.matches[0].lastGoalkeepers = { [match.visitorTeamId]: saved.primaryPlayerId! };
  await expect(repo.importBackup(invalid)).rejects.toThrow('Portero recordado inválido');
  invalid.matches[0].lastGoalkeepers = { [match.localTeamId]: `unknown:${match.localTeamId}` };
  await expect(repo.importBackup(invalid)).rejects.toThrow('Portero recordado inválido');
  const old = structuredClone(backup);
  delete old.matches[0].lastGoalkeepers;
  for (const player of old.players) delete player.isGoalkeeper;
  await repo.importBackup(old);
  expect((await db.matches.get(match.id))?.lastGoalkeepers).toBeUndefined();
  expect((await db.players.get(saved.primaryPlayerId!))?.isGoalkeeper).toBeUndefined();
});
