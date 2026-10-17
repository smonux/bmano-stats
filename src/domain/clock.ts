import { syncExclusions } from './exclusions';
import type { Clock, Match } from './schema';

export const elapsed = (clock: Clock, now = Date.now()) =>
  clock.elapsedMs + (clock.startedAt === null ? 0 : Math.max(0, now - clock.startedAt));
export type ClockAction = 'pause' | 'resume' | 'period' | 'finish';
export function changeClock(match: Match, action: ClockAction, now = Date.now()): Match {
  if (match.status === 'done') {
    throw new Error(
      'El partido ha finalizado. Puedes corregir sus eventos, pero el reloj está detenido.',
    );
  }
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
