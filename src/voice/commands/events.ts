import { spokenEvents, type SpokenEvent } from '../event-types';
import { numberKey } from '../numbers';
import type { AnalysisContext, TokenSpan } from '../analysis/types';
import { commandVocabulary } from './vocabulary';
import { levenshtein } from './distance';

export type CommandEvent = TokenSpan & {
  event: SpokenEvent | 'desconocido';
  match: 'literal' | 'approximate';
};

/** Consume the first event. Later words belong to its team, players and metadata. */
export function commandEvent(context: AnalysisContext): CommandEvent | undefined {
  const vocabulary = commandVocabulary[context.language];
  const cards = context.findPattern(vocabulary.card);
  const colours = [
    ...context
      .findPattern(vocabulary.yellow)
      .map((span) => ({ ...span, event: 'amarilla' as const })),
    ...context
      .findPattern(`${vocabulary.red}|${vocabulary.blue}`)
      .map((span) => ({ ...span, event: 'descalificacion' as const })),
  ].sort((a, b) => a.from - b.from);
  const cues = spokenEvents.flatMap((event) =>
    context.findPattern(vocabulary.events[event]).map((span) => ({ ...span, event })),
  );
  cues.push(...colours);
  // The recording protocol starts with the event; do not search later in free-form speech.
  const from = 0;
  if (cards.some((span) => span.from === from)) {
    const card = cards.find((span) => span.from === from)!;
    const colour = colours.find((span) => span.from >= from);
    return { ...card, event: colour?.event ?? 'desconocido', match: 'literal' };
  }
  const literal = cues.filter((cue) => cue.from === from).sort((a, b) => b.to - a.to)[0];
  if (literal) return { ...literal, match: 'literal' };
  // Roster/team words do not become approximate event keywords.
  if (
    [...context.knownNames, ...context.teamReferences].some(
      (span) => span.from <= from && span.to > from,
    )
  )
    return;
  const approximate = approximateAt(context, from);
  if (approximate) return approximate;
}

function approximateAt(context: AnalysisContext, from: number): CommandEvent | undefined {
  const candidates: (CommandEvent & { score: number })[] = [];
  for (const event of spokenEvents) {
    const pattern = new RegExp(`^(?:${commandVocabulary[context.language].events[event]})$`, 'u');
    for (const alias of context.rules.approximateAliases[event]) {
      const reference = numberKey(alias);
      if (!pattern.test(reference)) continue;
      const to = from + reference.split(' ').length;
      const value = context.words.slice(from, to).join(' ');
      if (value.length < 3 || Math.abs(value.length - reference.length) > 2) continue;
      const distance = levenshtein(value, reference);
      if (distance > (reference.length > 7 ? 2 : 1)) continue;
      candidates.push({
        event,
        from,
        to,
        match: 'approximate',
        score: 1 - distance / Math.max(value.length, reference.length),
      });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (
    !best ||
    candidates.some(
      (candidate) => candidate.event !== best.event && best.score - candidate.score < 0.12,
    )
  )
    return;
  return best;
}
