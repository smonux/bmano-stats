import type { Language } from '../i18n';
import { createAnalysisContext } from './analysis/context';
import { detectEvent } from './analysis/events';
import type { RulePlayer } from './analysis/types';

/** Rules choose only the action. Participant and team extraction belong to Needle. */
export function routeVoiceEvent(
  text: string,
  language: Language,
  teams: string[],
  players: RulePlayer[] = [],
) {
  const warnings: string[] = [];
  if (!text.trim() || text.length > 10_000) {
    return { event: null, warnings: ['No se ha identificado un evento por palabras clave.'] };
  }
  const context = createAnalysisContext(text, language, teams, players);
  const result = detectEvent(context, warnings);
  if (result.kind === 'rejected') {
    return { event: null, warnings: [...warnings, result.reason] };
  }
  return { event: result.event, warnings };
}
