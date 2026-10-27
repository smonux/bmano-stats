import type { Match } from './schema';

/** Shared write/preview boundary; no persistence side effects. */
export function validateEventPosition(
  draft: { period: number; teamId: string | null },
  match: Match,
) {
  if (draft.period > match.clock.period) throw new Error('El tiempo indicado aún no existe.');
  if (draft.teamId && ![match.localTeamId, match.visitorTeamId].includes(draft.teamId))
    throw new Error('El equipo no pertenece al partido.');
}
