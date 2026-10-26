import type { Match } from './schema';
import { createId } from './id';

export const EXCLUSION_DURATION_MS = 120000;
export const EXCLUSION_SLOT_COUNT = 4;
export type ExclusionSlot = 0 | 1 | 2 | 3;
export type ExclusionAction = 'start' | 'clear';
export type ExcludedPlayer = { teamId: string; dorsal: number | null };
export type ExclusionTimer = {
  id: string;
  teamId: string;
  dorsal: number | null;
  remainingMs: number;
  running: boolean;
  startedAt: number | null;
};
export const exclusionRemaining = (timer: ExclusionTimer, now = Date.now()) =>
  Math.max(
    0,
    timer.remainingMs - (timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt)),
  );
export function syncExclusions(match: Match, clockRunning: boolean, now: number, finish = false) {
  return match.exclusions?.map((timer) => {
    if (!timer) {
      return timer;
    }
    const remainingMs = exclusionRemaining(timer, now);
    const running = !finish;
    return {
      ...timer,
      remainingMs,
      running,
      startedAt: running && clockRunning && remainingMs > 0 ? now : null,
    };
  });
}

export function assertExclusionSlot(slot: number): asserts slot is ExclusionSlot {
  if (!Number.isInteger(slot) || slot < 0 || slot >= EXCLUSION_SLOT_COUNT) {
    throw new Error('Temporizador de exclusión inválido.');
  }
}

function assertExcludedPlayer(
  match: Match,
  player: ExcludedPlayer | undefined,
): asserts player is ExcludedPlayer {
  if (
    !player ||
    ![match.localTeamId, match.visitorTeamId].includes(player.teamId) ||
    (player.dorsal !== null &&
      (!Number.isInteger(player.dorsal) || player.dorsal < 0 || player.dorsal > 99))
  ) {
    throw new Error('Elige equipo y dorsal.');
  }
}

/** The repository checks match availability before applying this timer transition. */
export function changeExclusion(
  match: Match,
  slot: ExclusionSlot,
  action: ExclusionAction,
  player?: ExcludedPlayer,
  now = Date.now(),
  createTimerId = createId,
) {
  const timers = [...(match.exclusions ?? Array(EXCLUSION_SLOT_COUNT).fill(null))];
  const timer = timers[slot];
  if (action === 'start') {
    if (timer) {
      throw new Error('Libera el contador antes de usarlo de nuevo.');
    }
    assertExcludedPlayer(match, player);
    timers[slot] = {
      id: createTimerId(),
      ...player,
      remainingMs: EXCLUSION_DURATION_MS,
      running: true,
      startedAt: match.clock.startedAt === null ? null : now,
    };
  } else if (action === 'clear') {
    timers[slot] = null;
  } else {
    throw new Error('Acción de contador inválida.');
  }
  return timers;
}
