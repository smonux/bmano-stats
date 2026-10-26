import { expect, test } from 'vitest';
import { changeClock, finishAtTimeLimit, MATCH_TIME_LIMIT_MS } from './clock';
import { reportFixture } from '../../tests/fixtures/report';

const base = 100000;
function nearLimit() {
  const match = reportFixture().matches[0];
  match.clock = { period: 2, elapsedMs: MATCH_TIME_LIMIT_MS - 30000, startedAt: base };
  match.exclusions![0] = { ...match.exclusions![0]!, startedAt: base, remainingMs: 120000 };
  return match;
}

test('the current period finishes at 150:00, not a millisecond before', () => {
  const match = nearLimit();
  expect(finishAtTimeLimit(match, base + 29999)).toBe(match);
  const finished = finishAtTimeLimit(match, base + 30000);
  expect(finished).toMatchObject({
    status: 'done',
    clock: { period: 2, elapsedMs: MATCH_TIME_LIMIT_MS, startedAt: null },
  });
  expect(finished.exclusions![0]).toMatchObject({
    remainingMs: 90000,
    running: false,
    startedAt: null,
  });
  expect(match.status).toBe('active');
  expect(match.clock.startedAt).toBe(base);
});
test('a late wake stops timers at the deadline but records the actual write time', () => {
  const finished = finishAtTimeLimit(nearLimit(), base + 600000);
  expect(finished.clock.elapsedMs).toBe(MATCH_TIME_LIMIT_MS);
  expect(finished.updatedAt).toBe(base + 600000);
  expect(finished.exclusions![0]!.remainingMs).toBe(90000);
  expect(finishAtTimeLimit(finished, base + 900000)).toBe(finished);
});
test('paused time does not advance; resuming and changing period before the limit remain possible', () => {
  const paused = nearLimit();
  paused.clock.startedAt = null;
  paused.exclusions![0]!.startedAt = null;
  expect(finishAtTimeLimit(paused, base + 3600000)).toBe(paused);
  const resumed = changeClock(paused, 'resume', base + 3600000);
  expect(finishAtTimeLimit(resumed, base + 3629999)).toBe(resumed);
  expect(finishAtTimeLimit(resumed, base + 3630000).status).toBe('done');
  expect(changeClock(paused, 'period', base)).toMatchObject({
    status: 'active',
    clock: { period: 3, elapsedMs: 0, startedAt: base },
  });
  expect(changeClock(paused, 'finish', base).clock.elapsedMs).toBe(MATCH_TIME_LIMIT_MS - 30000);
});
test('overdue paused data finishes too; deleted and already finished matches remain untouched', () => {
  const match = nearLimit();
  match.clock = { period: 2, elapsedMs: MATCH_TIME_LIMIT_MS + 1000, startedAt: null };
  match.exclusions![0]!.startedAt = null;
  expect(finishAtTimeLimit(match, base).clock.elapsedMs).toBe(MATCH_TIME_LIMIT_MS);
  const deleted = { ...match, deletedAt: base };
  expect(finishAtTimeLimit(deleted, base + 1000)).toBe(deleted);
  const finished = { ...match, status: 'done' as const };
  expect(finishAtTimeLimit(finished, base + 1000)).toBe(finished);
});
test('a clock action racing the deadline finishes instead of starting a new period or resuming', () => {
  for (const action of ['pause', 'resume', 'period', 'finish'] as const) {
    const finished = changeClock(nearLimit(), action, base + 30000);
    expect(finished).toMatchObject({
      status: 'done',
      clock: { period: 2, elapsedMs: MATCH_TIME_LIMIT_MS, startedAt: null },
    });
    expect(() => changeClock(finished, 'resume', base + 40000)).toThrow('El partido ha finalizado');
  }
});
