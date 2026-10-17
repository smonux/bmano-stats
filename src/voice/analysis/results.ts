import type { AnalysisContext, DetectedEvent, InterpretationResult, RuleProposal } from './types';

export const REVIEW_WARNING = 'Interpretación por reglas: revisa los campos antes de guardar.';
export const NO_EVENT = 'No se ha identificado un evento por palabras clave.';
export const MULTIPLE_ACTIONS = 'Hay varias acciones posibles. Registra una jugada por grabación.';
export const NEGATED_ACTION = 'La jugada está negada o anulada. No se han supuesto datos.';
export const UNCERTAIN_ACTION =
  'La frase expresa una pregunta o duda. Completa el evento manualmente.';
export const UNKNOWN_TEAM = 'Equipo sin resolver. No se ha supuesto equipo 1 ni equipo 2.';

export function rejectInterpretation(
  reason: string,
  warnings: string[] = [REVIEW_WARNING],
): InterpretationResult {
  return { proposal: null, warnings: [...warnings, reason], eventKeyword: '', eventMatch: 'none' };
}

export function completeInterpretation(
  context: AnalysisContext,
  detected: DetectedEvent,
  proposal: RuleProposal,
  warnings: string[],
): InterpretationResult {
  if (proposal.equipo === 'desconocido') {
    warnings.push(UNKNOWN_TEAM);
  }
  return {
    proposal,
    warnings: [...new Set(warnings)],
    eventKeyword: context.originalText(detected.eventCues[0]),
    eventMatch: detected.match,
  };
}
