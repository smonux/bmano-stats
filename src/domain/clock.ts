import { syncExclusions } from './exclusions';
import type { Clock, Match } from './schema';

export const elapsed = (clock: Clock, now = Date.now()) =>
  clock.elapsedMs + (clock.startedAt === null ? 0 : Math.max(0, now - clock.startedAt));
export const MATCH_TIME_LIMIT_MS = 150 * 60000;
export const matchTimeLimitReached = (match: Match, now = Date.now()) =>
  match.deletedAt === null &&
  match.status === 'active' &&
  elapsed(match.clock, now) >= MATCH_TIME_LIMIT_MS;

/** Stop at the deadline even if the browser wakes later; repeated checks leave finished matches alone. */
export function finishAtTimeLimit(match: Match, now = Date.now()): Match {
  if (!matchTimeLimitReached(match, now)) return match;
  const stoppedAt =
    match.clock.startedAt === null
      ? now
      : Math.min(
          now,
          match.clock.startedAt + Math.max(0, MATCH_TIME_LIMIT_MS - match.clock.elapsedMs),
        );
  return {
    ...match,
    status: 'done',
    clock: { ...match.clock, elapsedMs: MATCH_TIME_LIMIT_MS, startedAt: null },
    exclusions: syncExclusions(match, false, stoppedAt, true),
    updatedAt: now,
  };
}
export type ClockAction = 'pause' | 'resume' | 'period' | 'finish';
export function changeClock(match: Match, action: ClockAction, now = Date.now()): Match {
  if (match.status === 'done') {
    throw new Error(
      'El partido ha finalizado. Puedes corregir sus eventos, pero el reloj está detenido.',
    );
  }
  const expired = finishAtTimeLimit(match, now);
  if (expired !== match) return expired;
  let clock = { ...match.clock };
  if (action === 'resume' && clock.startedAt === null) {
    clock.startedAt = now;
  }
  if (action === 'pause' || action === 'finish') {
    clock = { ...clock, elapsedMs: elapsed(clock, now), startedAt: null };
  }
  if (action === 'period') {
    clock = { period: clock.period + 1, elapsedMs: 0, startedAt: now };
  }
  return {
    ...match,
    exclusions: syncExclusions(match, clock.startedAt !== null, now, action === 'finish'),
    clock,
    status: action === 'finish' ? 'done' : 'active',
    updatedAt: now,
  };
}
