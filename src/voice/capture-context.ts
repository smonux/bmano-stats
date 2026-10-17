import { elapsed } from '../domain/clock';
import type { Match, Snapshot } from '../domain/schema';

export type CaptureContext = { match: Match; data: Snapshot; period: number; minute: number };
export function captureContext(match: Match, data: Snapshot): CaptureContext {
  return {
    match,
    data,
    period: match.clock.period,
    minute: Math.min(999, Math.floor(elapsed(match.clock) / 60000)),
  };
}
