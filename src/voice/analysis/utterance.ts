import { numberAt } from '../numbers';
import { uniqueTeam } from './spans';
import { NEGATED_ACTION, UNCERTAIN_ACTION, rejectInterpretation, REVIEW_WARNING } from './results';
import type { AnalysisContext, InterpretationResult, RuleProposal, TokenSpan } from './types';

const UNCERTAIN_NUMBER_ARTICLES = new Set(['un', 'una', 'ein', 'eine', 'une', 'een']);

/** Preserve the original order: question, uncertainty, then cancellation. */
export function inspectUtterance(context: AnalysisContext): InterpretationResult | undefined {
  const { text, rules, findPattern } = context;
  if (/[?¿]/u.test(text) || findPattern(rules.question).some((span) => span.from === 0)) {
    return rejectInterpretation(UNCERTAIN_ACTION);
  }
  const uncertainty = findPattern(rules.uncertain)[0];
  if (uncertainty) {
    if (!findPattern(rules.confirmedSanction).length) {
      return rejectInterpretation(UNCERTAIN_ACTION);
    }
    return extractUncertainSanction(context, uncertainty.from);
  }
  if (findPattern(rules.cancelled).length) {
    return rejectInterpretation(NEGATED_ACTION);
  }
}

/** A confirmed sanction with an uncertain type may retain only unambiguous literal participants. */
function extractUncertainSanction(
  context: AnalysisContext,
  boundary: number,
): InterpretationResult {
  const { tokens, words, language, rules, originalText, teamReferences } = context;
  const proposal: RuleProposal = {
    evento: 'desconocido',
    equipo: uniqueTeam(teamReferences, { from: 0, to: boundary }) ?? 'desconocido',
  };
  const shirts: number[] = [];
  for (let index = 0; index < boundary; index++) {
    const number = numberAt(words, index, language);
    if (!number) {
      continue;
    }
    if (number.value !== undefined && !UNCERTAIN_NUMBER_ARTICLES.has(words[index])) {
      shirts.push(number.value);
    }
    index = number.end - 1;
  }
  if (shirts.length === 1) {
    proposal.dorsal = shirts[0];
  }
  const stopWords = new Set(rules.stopWords);
  const names: TokenSpan[] = [];
  for (let index = 0; index < boundary; index++) {
    const isTeamWord = teamReferences.some(
      (reference) => reference.from <= index && reference.to > index,
    );
    if (
      !/^\p{Lu}/u.test(tokens[index].raw) ||
      stopWords.has(words[index]) ||
      isTeamWord ||
      numberAt(words, index, language)
    ) {
      continue;
    }
    let end = index + 1;
    while (end < boundary && /^\p{Lu}/u.test(tokens[end].raw) && !stopWords.has(words[end])) {
      end++;
    }
    names.push({ from: index, to: end });
    index = end - 1;
  }
  if (names.length === 1) {
    proposal.nombre = originalText(names[0]);
  }
  return {
    proposal,
    warnings: [
      REVIEW_WARNING,
      'La sanción está clara, pero su tipo no. Completa el evento manualmente.',
    ],
    eventKeyword: '',
    eventMatch: 'literal',
  };
}
