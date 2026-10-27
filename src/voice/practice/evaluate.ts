import type { EventDraft } from '../../data/database';
import type { Snapshot } from '../../domain/schema';
import { eventSchema } from '../../domain/schema';
import { definitions } from '../../domain/event-definitions';
import { eventDraftIssues, previewEventDraft } from '../../presentation/event-draft';
import { validateEventPosition } from '../../domain/event-position';
import type { PracticeChallenge } from './challenges';
import { ZodError } from 'zod';

export type PracticeEvaluation = {
  state: 'green' | 'amber' | 'red';
  issues: string[];
  missing: string[];
  wrong: string[];
};

/** Compare identities and roles after the real interpreter/editor, never transcript wording. */
export function evaluatePractice(
  draft: EventDraft,
  challenge: PracticeChallenge,
  data: Snapshot,
  assisted: boolean,
): PracticeEvaluation {
  const match = data.matches[0];
  const issues = eventDraftIssues(draft, match, data.players);
  try {
    validateEventPosition(draft, match);
    eventSchema.parse(previewEventDraft(draft, match, data.players).event);
  } catch (error) {
    issues.push(
      error instanceof Error && !(error instanceof ZodError)
        ? error.message
        : 'Revisa los datos de la jugada.',
    );
  }
  if (issues.length) return { state: 'red', issues: [...new Set(issues)], missing: [], wrong: [] };
  const missing: string[] = [];
  const wrong: string[] = [];
  const check = (label: string, actual: string | number | null, expected: string | number) => {
    if (actual === '' || actual === null) missing.push(label);
    else if (String(actual) !== String(expected)) wrong.push(label);
  };
  check('Evento', draft.type, challenge.type);
  check('Equipo', draft.teamId, challenge.teamId);
  const definition = definitions[challenge.type];
  if (challenge.primary !== undefined)
    check(
      definition.principal,
      draft.primaryDorsal === '' ? '' : Number(draft.primaryDorsal),
      challenge.primary,
    );
  if (challenge.related !== undefined)
    check(
      definition.related!,
      draft.relatedDorsal === '' ? '' : Number(draft.relatedDorsal),
      challenge.related,
    );
  if (draft.metadata.penalty) wrong.push('De penalti');
  if (draft.metadata.blue) wrong.push('Tarjeta azul');
  if (draft.metadata.infraction) wrong.push('Tipo de infracción');
  if (challenge.editRequired && !assisted && !missing.length && !wrong.length)
    missing.push('Confirma el dorsal 8 en el editor');
  return { state: missing.length || wrong.length ? 'amber' : 'green', issues: [], missing, wrong };
}
