import type { Language } from '../i18n';
import { createAnalysisContext } from './analysis/context';
import { inspectUtterance } from './analysis/utterance';
import { detectEvent } from './analysis/events';
import { extractMetadata } from './analysis/metadata';
import { extractParticipants } from './analysis/participants';
import { assignParticipantRoles } from './analysis/roles';
import {
  completeInterpretation,
  rejectInterpretation,
  NO_EVENT,
  REVIEW_WARNING,
} from './analysis/results';
import type { InterpretationResult, RulePlayer, RuleProposal } from './analysis/types';

export type { RulePlayer, RuleProposal } from './analysis/types';
const MAX_TRANSCRIPT_LENGTH = 10_000;

/** Whistle supplies text; each phase below applies deterministic, language-specific rules. */
export function interpretDeterministically(
  text: string,
  language: Language,
  teams: string[],
  players: RulePlayer[] = [],
): InterpretationResult {
  if (!text.trim() || text.length > MAX_TRANSCRIPT_LENGTH) {
    return rejectInterpretation(NO_EVENT);
  }
  const context = createAnalysisContext(text, language, teams, players);
  const utteranceDecision = inspectUtterance(context);
  if (utteranceDecision) {
    return utteranceDecision;
  }

  const warnings = [REVIEW_WARNING];
  const detected = detectEvent(context, warnings);
  if (detected.kind === 'rejected') {
    return rejectInterpretation(detected.reason, warnings);
  }
  const metadata = extractMetadata(context, detected.event);
  if (metadata.reason) {
    return rejectInterpretation(metadata.reason, warnings);
  }

  const participants = extractParticipants(context, detected, warnings);
  const proposal: RuleProposal = {
    evento: detected.event,
    equipo: 'desconocido',
    ...metadata.metadata,
  };
  const roleError = assignParticipantRoles(context, detected, participants, proposal, warnings);
  if (roleError) {
    return rejectInterpretation(roleError, warnings);
  }
  return completeInterpretation(context, detected, proposal, warnings);
}
