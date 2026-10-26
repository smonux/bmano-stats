import type { Match } from './schema';
import { exclusionRemaining } from './exclusions';

/** Adapt the former three independently paused slots once, preserving the remaining duration. */
export function migrateLegacyExclusions(match: Match, now = Date.now()): Match {
  if (!match.exclusions || match.exclusions.length !== 3) return match;
  const running = match.status === 'active';
  const timers = match.exclusions.map((timer) => {
    if (!timer) return null;
    const remainingMs = exclusionRemaining(timer, now);
    return {
      ...timer,
      remainingMs,
      running,
      startedAt: running && match.clock.startedAt !== null && remainingMs > 0 ? now : null,
    };
  });
  return { ...match, exclusions: [...timers, null] };
}
