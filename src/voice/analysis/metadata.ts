import { MULTIPLE_ACTIONS } from './results';
import type { SpokenEvent } from '../event-types';
import type { AnalysisContext, RuleProposal } from './types';

type Metadata = Pick<RuleProposal, 'penalti' | 'azul' | 'infraccion'>;
export function extractMetadata(
  context: AnalysisContext,
  event: SpokenEvent,
): { metadata: Metadata; reason?: never } | { reason: string; metadata?: never } {
  const { rules, findPattern } = context;
  const metadata: Metadata = {};
  if (['gol', 'parada', 'fallo'].includes(event) && findPattern(rules.penalty).length) {
    metadata.penalti = true;
  }
  if (event === 'descalificacion' && findPattern(rules.blue).length) {
    metadata.azul = true;
  }
  if (event === 'infraccion') {
    const subtypes = (Object.keys(rules.infraction) as (keyof typeof rules.infraction)[]).filter(
      (kind) => findPattern(rules.infraction[kind]).length,
    );
    if (subtypes.length === 1) {
      metadata.infraccion = subtypes[0];
    } else if (subtypes.length > 1) {
      return { reason: MULTIPLE_ACTIONS };
    }
  }
  return { metadata };
}
