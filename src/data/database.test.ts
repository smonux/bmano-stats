import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { HandballDatabase, repository, type EventDraft } from './database';
import { changeClock, elapsed, eventState, unknownId, type Match } from '../domain/model';
import { calculate, efficacy, emptyStats } from '../domain/statistics';
let db: HandballDatabase;
let repo: ReturnType<typeof repository>;
let match: Match;
beforeEach(async () => {
  db = new HandballDatabase(crypto.randomUUID());
  repo = repository(db);
  match = await repo.createMatch(
    {
      name: 'Local',
    },
    {
      name: 'Visitante',
    },
    '2026-10-15',
  );
});
afterEach(async () => {
  await db.delete();
});
const draft = (type: EventDraft['type'], extra: Partial<EventDraft> = {}): EventDraft => ({
  matchId: match.id,
  type,
  teamId: match.localTeamId,
  period: 1,
  minute: 0,
  metadata: {},
  primaryDorsal: '',
  relatedDorsal: '',
  note: '',
  rawText: '',
  ...extra,
});
const stats = async () => {
  const snapshot = await db.snapshot();
  return calculate(snapshot.matches, snapshot.events, snapshot.players);
};
test('notes have no attribution or statistical effects and survive backup and reload', async () => {
  await repo.saveEvent(draft('goal', { primaryDorsal: '7' }));
  const before = await db.snapshot();
  const beforeStats = await stats();
  const note = 'El árbitro advierte de posible exclusión.\nRecordar a Sara que no se dirija a él.';
  const rawText = `Nota: ${note}`;
  const saved = await repo.saveEvent(
    draft('note', {
      // Stale editor fields must neither create players nor survive on a note.
      primaryDorsal: '33',
      relatedDorsal: '44',
      metadata: { penalty: true, blue: true },
      note,
      rawText,
    }),
  );
  expect(saved).toMatchObject({
    type: 'note',
    teamId: null,
    primaryPlayerId: null,
    relatedPlayerId: null,
    metadata: {},
    note,
    rawText,
  });
  expect(eventState(saved, match, before.players)).toBe('valid');
  expect((await db.snapshot()).players).toEqual(before.players);
  expect((await db.snapshot()).matches).toEqual(before.matches);
  expect(await stats()).toEqual(beforeStats);
  const backup = await repo.exportBackup();
  await repo.importBackup(JSON.parse(JSON.stringify(backup)));
  db.close();
  await db.open();
  expect(await db.events.get(saved.id)).toEqual(saved);
  expect(await stats()).toEqual(beforeStats);
  const invalid = structuredClone(backup);
  invalid.events.find((event) => event.id === saved.id)!.teamId = match.localTeamId;
  await expect(repo.importBackup(invalid)).rejects.toThrow('campos incompatibles');
  const empty = await repo.saveEvent(draft('note', { teamId: null, note: '  ' }));
  expect(eventState(empty, match, before.players)).toBe('pending');
  expect(await stats()).toEqual(beforeStats);
});
test('unknown goal counts once; correction moves attribution; deletion removes consequences', async () => {
  const savedEvent = await repo.saveEvent(draft('goal'));
  expect((await stats()).players[unknownId(match.localTeamId)].goals).toBe(1);
  await repo.saveEvent(
    draft('goal', {
      id: savedEvent.id,
      expectedUpdatedAt: savedEvent.updatedAt,
      primaryDorsal: '7',
      relatedDorsal: '9',
    }),
  );
  const statistics = await stats();
  expect(statistics.teams[match.localTeamId].goals).toBe(1);
  expect(statistics.players[unknownId(match.localTeamId)]).toBeUndefined();
  expect(Object.values(statistics.players).reduce((n, player) => n + player.assists, 0)).toBe(1);
  expect(await db.events.count()).toBe(1);
  await repo.deleteEvent(savedEvent.id);
  expect((await stats()).teams).toEqual({});
});
test('save and recovery derive opposite consequences without extra events', async () => {
  await repo.saveEvent(
    draft('save', {
      primaryDorsal: '1',
      relatedDorsal: '8',
      metadata: {
        penalty: true,
      },
    }),
  );
  await repo.saveEvent(draft('recovery'));
  await repo.saveEvent(draft('loss'));
  const statistics = await stats();
  expect(statistics.teams[match.localTeamId]).toMatchObject({
    saves: 1,
    recoveries: 1,
    losses: 1,
    penaltySaves: 1,
  });
  expect(statistics.teams[match.visitorTeamId]).toMatchObject({
    shots: 1,
    misses: 1,
    losses: 1,
    recoveries: 0,
    penaltyMisses: 1,
  });
  expect(await db.events.count()).toBe(3);
});
test('pending events do not count; passive has no individual; infraction requires subtype', async () => {
  const savedEvent = await repo.saveEvent(
    draft('goal', {
      teamId: null,
    }),
  );
  expect(eventState(savedEvent, match, [])).toBe('pending');
  await repo.saveEvent(draft('infraction'));
  await repo.saveEvent(draft(null));
  expect((await stats()).teams).toEqual({});
  await repo.saveEvent(draft('passive'));
  expect((await stats()).players).toEqual({});
  expect((await stats()).teams[match.localTeamId]).toMatchObject({
    passives: 1,
    losses: 0,
  });
  await repo.saveEvent(
    draft('infraction', {
      metadata: {
        infraction: 'Pasos',
      },
    }),
  );
  expect((await stats()).teams[match.localTeamId]).toMatchObject({
    losses: 1,
    infractions: 1,
    Pasos: 1,
  });
});
test('disciplinary and penalty events count without inventing assists or provocateurs', async () => {
  for (const type of ['penalty', 'exclusion', 'yellow', 'disqualification'] as const) {
    await repo.saveEvent(
      draft(type, {
        metadata: {
          blue: true,
        },
      }),
    );
  }
  const statistics = await stats();
  expect(statistics.teams[match.localTeamId]).toMatchObject({
    penalties: 1,
    exclusions: 1,
    yellow: 1,
    disqualifications: 1,
    blue: 1,
  });
  expect(statistics.players[unknownId(match.localTeamId)].forcedExclusions).toBe(0);
  expect(statistics.teams[match.visitorTeamId].penaltiesReceived).toBe(1);
});
test('clock pauses, resumes, supports extra periods and stays stopped after finish', () => {
  const runningMatch = {
    ...match,
    clock: {
      period: 1,
      elapsedMs: 0,
      startedAt: 1000,
    },
  };
  const paused = changeClock(runningMatch, 'pause', 61000);
  expect(elapsed(paused.clock, 90000)).toBe(60000);
  const resumed = changeClock(paused, 'resume', 90000);
  expect(elapsed(resumed.clock, 120000)).toBe(90000);
  let next = changeClock(resumed, 'period', 120000);
  next = changeClock(next, 'period', 130000);
  expect(next.clock.period).toBe(3);
  const done = changeClock(next, 'finish', 140000);
  expect(done.clock.startedAt).toBeNull();
  expect(() => changeClock(done, 'resume')).toThrow();
  expect(efficacy(emptyStats())).toBe('—');
});
test('invalid writes roll back automatic teams and players', async () => {
  await expect(
    repo.createMatch(
      {
        name: 'Duplicado',
      },
      {
        name: 'Duplicado',
      },
      '2026-10-15',
    ),
  ).rejects.toThrow();
  expect(await db.teams.count()).toBe(2);
  await expect(
    repo.saveEvent(
      draft('goal', {
        primaryDorsal: '6',
        minute: -1,
      }),
    ),
  ).rejects.toThrow();
  expect(await db.players.count()).toBe(2);
});
test('concurrent dorsal reuse and stale edits are safe', async () => {
  const [savedEvent] = await Promise.all([
    repo.saveEvent(
      draft('goal', {
        primaryDorsal: '7',
      }),
    ),
    repo.saveEvent(
      draft('miss', {
        primaryDorsal: '7',
      }),
    ),
  ]);
  expect(await db.players.count()).toBe(3);
  await repo.saveEvent(
    draft('goal', {
      id: savedEvent.id,
      expectedUpdatedAt: savedEvent.updatedAt,
      primaryDorsal: '7',
      minute: 1,
    }),
  );
  await expect(
    repo.saveEvent(
      draft('goal', {
        id: savedEvent.id,
        expectedUpdatedAt: savedEvent.updatedAt,
      }),
    ),
  ).rejects.toThrow('otra ventana');
});
test('backup roundtrip retains pending events; corrupt import leaves data intact', async () => {
  await repo.saveEvent(draft(null));
  await repo.saveEvent(draft('goal'));
  const backup = await repo.exportBackup();
  await repo.importBackup(JSON.parse(JSON.stringify(backup)));
  expect(await db.snapshot()).toEqual({
    teams: backup.teams,
    players: backup.players,
    matches: backup.matches,
    events: backup.events,
  });
  const invalid = structuredClone(backup);
  invalid.events[0].matchId = 'missing';
  await expect(repo.importBackup(invalid)).rejects.toThrow();
  expect(await db.events.count()).toBe(2);
  await repo.deleteMatch(match.id);
  expect((await stats()).teams).toEqual({});
});
test('three suspension timers survive backup and follow pauses, individual stops and period changes', async () => {
  const { vi } = await import('vitest');
  const { exclusionRemaining } = await import('../domain/exclusions');
  let now = Date.now();
  const mock = vi.spyOn(Date, 'now').mockImplementation(() => now);
  const read = async () => (await db.matches.get(match.id))!;
  try {
    for (let slot = 0; slot < 4; slot++) {
      await repo.exclusion(match.id, slot, 'start', {
        teamId: slot === 1 ? match.visitorTeamId : match.localTeamId,
        dorsal: slot + 7,
      });
    }
    await expect(
      repo.exclusion(match.id, 4, 'start', {
        teamId: match.localTeamId,
        dorsal: 4,
      }),
    ).rejects.toThrow();
    await expect(
      repo.exclusion(match.id, 0, 'start', {
        teamId: match.localTeamId,
        dorsal: 4,
      }),
    ).rejects.toThrow();
    now += 30000;
    await repo.clock(match.id, 'pause');
    expect((await read()).exclusions?.[0]?.remainingMs).toBe(90000);
    now += 60000;
    expect(exclusionRemaining((await read()).exclusions![0]!)).toBe(90000);
    await repo.clock(match.id, 'resume');
    now += 20000;
    await repo.clock(match.id, 'period');
    const next = await read();
    expect(next.clock.period).toBe(2);
    expect(next.exclusions?.map((timer) => timer?.remainingMs)).toEqual([
      70000, 70000, 70000, 70000,
    ]);
    const backup = await repo.exportBackup();
    await repo.importBackup(JSON.parse(JSON.stringify(backup)));
    expect((await read()).exclusions).toEqual(next.exclusions);
    const invalid = structuredClone(backup);
    invalid.matches[0].exclusions![0]!.teamId = 'other';
    await expect(repo.importBackup(invalid)).rejects.toThrow();
    expect((await read()).exclusions).toEqual(next.exclusions);
    now += 70000;
    expect(exclusionRemaining((await read()).exclusions![0]!)).toBe(0);
    expect(exclusionRemaining((await read()).exclusions![1]!)).toBe(0);
    await repo.exclusion(match.id, 0, 'clear');
    expect((await read()).exclusions![0]).toBeNull();
    await repo.clock(match.id, 'finish');
    const done = await read();
    expect(done.exclusions![1]).toMatchObject({
      running: false,
      startedAt: null,
      remainingMs: 0,
    });
    await expect(
      repo.exclusion(match.id, 0, 'start', {
        teamId: match.localTeamId,
        dorsal: 9,
      }),
    ).rejects.toThrow();
    expect(await db.events.count()).toBe(0);
  } finally {
    mock.mockRestore();
  }
});
test('suspension timer accepts an unknown shirt number and preserves it in backups', async () => {
  await repo.exclusion(match.id, 0, 'start', {
    teamId: match.localTeamId,
    dorsal: null,
  });
  const backup = await repo.exportBackup();
  expect(backup.matches[0].exclusions![0]!.dorsal).toBeNull();
  await repo.importBackup(JSON.parse(JSON.stringify(backup)));
  expect((await db.matches.get(match.id))!.exclusions![0]).toMatchObject({
    teamId: match.localTeamId,
    dorsal: null,
  });
});
test('substitutions store two teammates, count one change with per-player entries/exits, and survive restore', async () => {
  const event = await repo.saveEvent(
    draft('substitution', {
      primaryDorsal: '6',
      relatedDorsal: '9',
      metadata: {
        penalty: true,
        blue: true,
        infraction: 'Pasos',
      },
    }),
  );
  const snapshot = await db.snapshot();
  expect(snapshot.players.find((player) => player.id === event.primaryPlayerId)).toMatchObject({
    teamId: match.localTeamId,
    dorsal: 6,
  });
  expect(snapshot.players.find((player) => player.id === event.relatedPlayerId)).toMatchObject({
    teamId: match.localTeamId,
    dorsal: 9,
  });
  expect(event.metadata).toEqual({});
  expect(eventState(event, match, snapshot.players)).toBe('valid');
  const calculated = await stats();
  expect(calculated.teams[match.localTeamId]).toEqual({
    ...emptyStats(),
    substitutions: 1,
  });
  expect(calculated.teams[match.visitorTeamId]).toBeUndefined();
  expect(calculated.players[event.primaryPlayerId!]).toEqual({
    ...emptyStats(),
    substitutionsOut: 1,
  });
  expect(calculated.players[event.relatedPlayerId!]).toEqual({
    ...emptyStats(),
    substitutionsIn: 1,
  });
  const backup = await repo.exportBackup();
  await repo.importBackup(JSON.parse(JSON.stringify(backup)));
  expect(await stats()).toEqual(calculated);
  const invalid = structuredClone(backup);
  invalid.events[0].relatedPlayerId = unknownId(match.visitorTeamId);
  await expect(repo.importBackup(invalid)).rejects.toThrow('relacionado');
  await repo.deleteEvent(event.id);
  expect((await stats()).teams).toEqual({});
});
test('unknown substitution participants remain usable; the same known player cannot enter and exit', async () => {
  const event = await repo.saveEvent(
    draft('substitution', {
      primaryDorsal: '6',
      relatedDorsal: '6',
    }),
  );
  expect(eventState(event, match, (await db.snapshot()).players)).toBe('pending');
  expect((await stats()).teams).toEqual({});
  await repo.saveEvent(
    draft('substitution', {
      id: event.id,
      expectedUpdatedAt: event.updatedAt,
      relatedDorsal: '9',
    }),
  );
  const snapshot = await db.snapshot();
  expect(eventState(snapshot.events[0], match, snapshot.players)).toBe('unidentified');
  expect((await stats()).teams[match.localTeamId].substitutions).toBe(1);
  expect((await stats()).players[unknownId(match.localTeamId)].substitutionsOut).toBe(1);
});
