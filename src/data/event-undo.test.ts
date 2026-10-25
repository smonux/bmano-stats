import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { HandballDatabase, repository, type EventDraft } from './database';
import type { Match } from '../domain/schema';
import { calculate } from '../domain/statistics';
let db: HandballDatabase;
let repo: ReturnType<typeof repository>;
let match: Match;
beforeEach(async () => {
  db = new HandballDatabase(crypto.randomUUID());
  repo = repository(db);
  match = await repo.createMatch({ name: 'La Jota' }, { name: 'Rival' }, '2026-10-25');
});
afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});
const draft = (extra: Partial<EventDraft> = {}): EventDraft => ({
  matchId: match.id,
  type: 'goal',
  teamId: match.localTeamId,
  primaryDorsal: '7',
  relatedDorsal: '',
  period: 1,
  minute: 1,
  metadata: {},
  note: '',
  rawText: '',
  ...extra,
});

test('undo removes a goal and only its created players, preserving unrelated clock, timer and events', async () => {
  const before = await db.snapshot();
  const { event, undo } = await repo.createEventWithUndo(draft({ relatedDorsal: '9' }));
  const unrelated = await repo.saveEvent(
    draft({ type: 'loss', teamId: match.visitorTeamId, primaryDorsal: '10' }),
  );
  await repo.clock(match.id, 'pause');
  await repo.exclusion(match.id, 0, 'start', { teamId: match.localTeamId, dorsal: 7 });
  const clockAndCounters = await db.matches.get(match.id);
  await repo.undoEventCreation(undo);
  expect(await db.events.get(event.id)).toBeUndefined();
  expect(await db.events.get(unrelated.id)).toEqual(unrelated);
  expect(await db.matches.get(match.id)).toEqual(clockAndCounters);
  expect(await db.players.get(event.primaryPlayerId!)).toBeUndefined();
  expect(await db.players.get(event.relatedPlayerId!)).toBeUndefined();
  const data = await db.snapshot();
  expect(data.players).toEqual(expect.arrayContaining(before.players));
  expect(
    calculate(data.matches, data.events, data.players).teams[match.localTeamId]?.goals ?? 0,
  ).toBe(0);
  await repo.importBackup(await repo.exportBackup());
  await expect(repo.undoEventCreation(undo)).rejects.toThrow('No se puede deshacer');
});

test.each([false, true])(
  'save undo restores previous keeper and all player effects (archived=%s)',
  async (archived) => {
    await repo.savePlayer(match.localTeamId, '1', 'Portera anterior', true);
    const previous = (await db.players
      .where('[teamId+dorsal]')
      .equals([match.localTeamId, 1])
      .first())!;
    await db.matches.update(match.id, { lastGoalkeepers: { [match.localTeamId]: previous.id } });
    if (archived) {
      await repo.savePlayer(match.localTeamId, '7', 'Jugadora archivada', false);
      const player = (await db.players
        .where('[teamId+dorsal]')
        .equals([match.localTeamId, 7])
        .first())!;
      await db.players.update(player.id, { deletedAt: 12 });
    }
    const before = await db.snapshot();
    const { undo } = await repo.createEventWithUndo(draft({ type: 'save', relatedDorsal: '99' }));
    await repo.clock(match.id, 'pause');
    await repo.undoEventCreation(undo);
    const after = await db.snapshot();
    expect(after.players).toEqual(before.players);
    expect(after.events).toEqual(before.events);
    expect(after.matches[0].lastGoalkeepers).toEqual(before.matches[0].lastGoalkeepers);
    expect(after.matches[0].clock.startedAt).toBeNull();
    await repo.importBackup(await repo.exportBackup());
  },
);

test('undo of a first save removes its keeper map without changing the other team', async () => {
  const { undo } = await repo.createEventWithUndo(draft({ type: 'save' }));
  const opponent = await repo.saveEvent(
    draft({ type: 'save', teamId: match.visitorTeamId, primaryDorsal: '1' }),
  );
  await repo.undoEventCreation(undo);
  expect((await db.matches.get(match.id))?.lastGoalkeepers).toEqual({
    [match.visitorTeamId]: opponent.primaryPlayerId,
  });
});

test.each(['edited', 'deleted', 'player', 'reference', 'keeper'] as const)(
  'undo rejects %s conflicts atomically',
  async (kind) => {
    vi.spyOn(Date, 'now').mockReturnValue(2000000);
    const { event, undo } = await repo.createEventWithUndo(draft({ type: 'save' }));
    if (kind === 'edited')
      await repo.saveEvent(
        draft({
          id: event.id,
          expectedUpdatedAt: event.updatedAt,
          type: 'save',
          note: 'corregido',
        }),
      );
    if (kind === 'deleted') await repo.deleteEvent(event.id);
    if (kind === 'player') await repo.savePlayer(match.localTeamId, '7', 'Nombre corregido');
    if (kind === 'reference') await repo.saveEvent(draft({ type: 'loss' }));
    if (kind === 'keeper') await repo.saveEvent(draft({ type: 'save' }));
    const before = await db.snapshot();
    await expect(repo.undoEventCreation(undo)).rejects.toThrow('No se puede deshacer');
    expect(await db.snapshot()).toEqual(before);
  },
);

test('transaction failure rolls back removal and a creation API refuses an edit', async () => {
  const { event, undo } = await repo.createEventWithUndo(draft());
  await expect(repo.createEventWithUndo(draft({ id: event.id }))).rejects.toThrow('jugada nueva');
  const before = await db.snapshot();
  const fail = () => {
    throw new Error('simulated write failure');
  };
  db.players.hook('deleting', fail);
  await expect(repo.undoEventCreation(undo)).rejects.toThrow('simulated write failure');
  db.players.hook('deleting').unsubscribe(fail);
  expect(await db.snapshot()).toEqual(before);
});

test('undo of pending and note creations needs no player effects', async () => {
  for (const entry of [
    draft({ type: null, teamId: null, primaryDorsal: '' }),
    draft({ type: 'note', note: 'Recordatorio' }),
  ]) {
    const before = await db.snapshot();
    const { undo } = await repo.createEventWithUndo(entry);
    expect(undo.players).toEqual([]);
    await repo.undoEventCreation(undo);
    expect(await db.snapshot()).toEqual(before);
  }
});
