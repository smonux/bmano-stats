import type { Match } from './model';
export type ExclusionTimer = { id: string; teamId: string; dorsal: number; remainingMs: number; running: boolean; startedAt: number | null };
export const exclusionRemaining = (timer: ExclusionTimer, now = Date.now()) => Math.max(0, timer.remainingMs - (timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt)));
export function syncExclusions(match: Match, clockRunning: boolean, now: number, finish = false) {
  return match.exclusions?.map(timer => timer && ({ ...timer, remainingMs: exclusionRemaining(timer, now), running: !finish && timer.running, startedAt: !finish && timer.running && clockRunning && exclusionRemaining(timer, now) > 0 ? now : null }));
}
