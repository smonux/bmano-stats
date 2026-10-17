import { approximateEvent } from '../approximate';
import { spokenEvents } from '../event-types';
import type { SpokenEvent } from '../event-types';
import { numberKey } from '../numbers';
import { escapePattern } from './context';
import { contains, overlaps, markTokens } from './spans';
import { MULTIPLE_ACTIONS, NEGATED_ACTION, NO_EVENT } from './results';
import type { AnalysisContext, EventCue, EventDecision, SubstitutionMarkers } from './types';

const MAX_NEGATION_GAP = 3;
const MAX_PENALTY_QUALIFIER_DISTANCE = 4;
const APPROXIMATE_WARNING =
  'Evento reconocido por aproximación de palabra clave. Revisa el tipo de evento.';

/** Literal keywords take precedence; approximation runs only when none survive context filters. */
export function detectEvent(context: AnalysisContext, warnings: string[]): EventDecision {
  const substitution = findSubstitutionMarkers(context);
  const candidates = findLiteralCandidates(context, substitution);
  let match: 'literal' | 'approximate' = 'literal';
  if (!candidates.length && allowsApproximation(context)) {
    const closest = findApproximateCandidate(context);
    if (closest && !(closest.event === 'sustitucion' && isNonPlayerChange(context))) {
      candidates.push(closest);
      match = 'approximate';
      warnings.push(APPROXIMATE_WARNING);
    }
  }
  if (isNegatedAction(context, candidates)) {
    return { kind: 'rejected', reason: NEGATED_ACTION };
  }
  const decision = resolveEventConflicts(context, candidates);
  if (decision.kind === 'rejected') {
    return decision;
  }
  const eventCues = candidates.filter((candidate) => candidate.event === decision.event);
  if (hasRepeatedEventNoun(context, eventCues, decision.event)) {
    return { kind: 'rejected', reason: MULTIPLE_ACTIONS };
  }
  return { kind: 'event', event: decision.event, candidates, eventCues, match, substitution };
}

function findSubstitutionMarkers(context: AnalysisContext): SubstitutionMarkers {
  const { rules, findPattern, knownNames, teamNames } = context;
  const roleMatches = (pattern: string) =>
    findPattern(pattern).filter(
      (span) => ![...knownNames, ...teamNames].some((name) => overlaps(name, span)),
    );
  return {
    outgoing: roleMatches(rules.substitution.out),
    incoming: roleMatches(rules.substitution.in),
    connectors: roleMatches(rules.substitution.connector),
  };
}

function isNonPlayerChange(context: AnalysisContext): boolean {
  return context.findPattern(context.rules.substitution.irrelevant).length > 0;
}

function isPlayerSubstitution(context: AnalysisContext, markers: SubstitutionMarkers): boolean {
  const { rules, findPattern, knownNames, teamNames, language } = context;
  const hasNoun = findPattern(rules.substitution.noun).some(
    (span) => ![...knownNames, ...teamNames].some((name) => overlaps(name, span)),
  );
  const bothDirections = markers.outgoing.length > 0 && markers.incoming.length > 0;
  const spanishReplacement =
    language === 'es' &&
    markers.connectors.length > 0 &&
    (markers.outgoing.length > 0 || markers.incoming.length > 0);
  return !isNonPlayerChange(context) && (hasNoun || bothDirections || spanishReplacement);
}

function findLiteralCandidates(
  context: AnalysisContext,
  substitution: SubstitutionMarkers,
): EventCue[] {
  const { rules, findPattern, knownNames, teamNames } = context;
  return spokenEvents
    .flatMap((event) =>
      findPattern(rules.events[event])
        .filter((span) => ![...teamNames, ...knownNames].some((name) => overlaps(name, span)))
        .map((span) => ({ ...span, event })),
    )
    .filter((cue) => isEventInContext(context, cue, substitution));
}

function isEventInContext(
  context: AnalysisContext,
  cue: EventCue,
  substitution: SubstitutionMarkers,
): boolean {
  const { rules, findPattern, language, originalText } = context;
  const patterns = rules.context;
  if (cue.event === 'sustitucion') {
    return isPlayerSubstitution(context, substitution);
  }
  // Shirt colours and scoreboard commentary do not describe disciplinary actions or goals.
  if (
    cue.event === 'descalificacion' &&
    findPattern(patterns.clothes).length &&
    !findPattern(patterns.card).length
  ) {
    return false;
  }
  if (cue.event === 'gol' && findPattern(patterns.score).length) {
    return false;
  }
  if (
    cue.event === 'exclusion' &&
    findPattern(patterns.remaining).length &&
    !findPattern(patterns.suspension).length
  ) {
    return false;
  }
  if (
    language === 'es' &&
    cue.event === 'fallo' &&
    /fuera|desviado/u.test(originalText(cue)) &&
    !findPattern('tiro|lanzamiento|lanza|lanzo|tira|tiro').length
  ) {
    return false;
  }
  return true;
}

function allowsApproximation(context: AnalysisContext): boolean {
  const { clothes, score, remaining } = context.rules.context;
  return context.findPattern([clothes, score, remaining].join('|')).length === 0;
}

function findApproximateCandidate(context: AnalysisContext): EventCue | undefined {
  const excluded = new Set<number>();
  for (const span of context.teamNames) {
    markTokens(excluded, span);
  }
  // Keep the original treatment of blank roster entries as well as named players.
  for (const player of context.players) {
    for (const span of context.findPattern(escapePattern(numberKey(player.name)))) {
      markTokens(excluded, span);
    }
  }
  return approximateEvent(context.words, context.language, excluded);
}

function isNegatedAction(context: AnalysisContext, candidates: EventCue[]): boolean {
  const { rules, findPattern, correction } = context;
  const missedNegations = findPattern(rules.missNegation);
  const negations = findPattern(rules.negation).filter(
    (span) => !missedNegations.some((miss) => contains(miss, span)),
  );
  // "No marca" is a miss. Negating an earlier, corrected shirt does not negate the new action.
  return candidates.some((cue) =>
    negations.some(
      (negation) =>
        negation.from <= cue.from &&
        cue.from - negation.to <= MAX_NEGATION_GAP &&
        !(correction && negation.to < correction.from && cue.from >= correction.to),
    ),
  );
}

type EventChoice = { kind: 'selected'; event: SpokenEvent } | { kind: 'rejected'; reason: string };

function resolveEventConflicts(context: AnalysisContext, candidates: EventCue[]): EventChoice {
  const { rules, findPattern, language, normalizedText } = context;
  const events = new Set(candidates.map((candidate) => candidate.event));
  if (language === 'es') {
    resolveSpanishOverlaps(context, events);
  }
  // A distance by itself does not distinguish a conceded penalty from a shot.
  if (
    events.size === 1 &&
    events.has('penalti_cometido') &&
    /^(?:siete|7) (?:metros|m)$/u.test(normalizedText)
  ) {
    return { kind: 'rejected', reason: NO_EVENT };
  }
  if (isPenaltyShotQualifier(context, events, candidates)) {
    events.delete('penalti_cometido');
  }
  if (events.has('fallo') && findPattern(rules.missNegation).length) {
    events.delete('gol');
  }
  if (isRecoveryWithOpposingLoss(context, events, candidates)) {
    events.delete('perdida');
  }
  if (events.has('pasivo') && findPattern(rules.warningOnly).length) {
    return {
      kind: 'rejected',
      reason: 'Solo se ha reconocido un aviso de pasivo, sin infracción confirmada.',
    };
  }
  if (events.size !== 1) {
    return { kind: 'rejected', reason: events.size ? MULTIPLE_ACTIONS : NO_EVENT };
  }
  return { kind: 'selected', event: [...events][0] };
}

function resolveSpanishOverlaps(context: AnalysisContext, events: Set<SpokenEvent>): void {
  const { rules, findPattern } = context;
  if (
    events.has('parada') &&
    events.has('gol') &&
    findPattern('(?:evitar|evito|nego) (?:el )?(?:gol|tanto)').length
  ) {
    events.delete('gol');
  }
  if (
    events.has('penalti_cometido') &&
    events.has('infraccion') &&
    !Object.values(rules.infraction).some((pattern) => findPattern(pattern).length)
  ) {
    events.delete('infraccion');
  }
  if (events.has('pasivo') && events.has('parada') && findPattern('arbitr[oa]').length) {
    events.delete('parada');
  }
}

function isPenaltyShotQualifier(
  context: AnalysisContext,
  events: Set<SpokenEvent>,
  candidates: EventCue[],
): boolean {
  const hasShot = [...events].some((event) => ['gol', 'parada', 'fallo'].includes(event));
  const separatelyCommitted = context
    .findPattern(context.rules.committed)
    .some((verb) =>
      candidates.some(
        (cue) =>
          cue.event === 'penalti_cometido' &&
          Math.abs(verb.from - cue.from) <= MAX_PENALTY_QUALIFIER_DISTANCE,
      ),
    );
  return hasShot && !separatelyCommitted;
}

function isRecoveryWithOpposingLoss(
  context: AnalysisContext,
  events: Set<SpokenEvent>,
  candidates: EventCue[],
): boolean {
  if (!events.has('recuperacion') || !events.has('perdida')) {
    return false;
  }
  const losses = candidates.filter((candidate) => candidate.event === 'perdida');
  const relation = context.rules.relation.recuperacion!;
  return (
    losses.length === 1 &&
    context
      .findPattern(relation.after + '|' + relation.before)
      .some((span) => overlaps(span, losses[0]))
  );
}

function hasRepeatedEventNoun(
  context: AnalysisContext,
  cues: EventCue[],
  event: SpokenEvent,
): boolean {
  // Preserve the existing canonical-noun check; extending it is a behavior change.
  const noun = event === 'penalti_cometido' ? 'penalti' : event;
  return cues.filter((cue) => context.words.slice(cue.from, cue.to).join(' ') === noun).length > 1;
}
