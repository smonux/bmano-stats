import type { Language } from '../../i18n';
import { languageRules } from '../languages';
import { numberKey } from '../numbers';
import { contains, overlaps } from './spans';
import type { AnalysisContext, RulePlayer, TeamReference, Token, TokenSpan } from './types';

const expressions = new Map<string, RegExp>();
export const escapePattern = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Prepare token positions and explicit references once for all analysis phases. */
export function createAnalysisContext(
  text: string,
  language: Language,
  teams: string[],
  players: RulePlayer[],
): AnalysisContext {
  const rules = languageRules[language];
  const tokens: Token[] = [...text.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => ({
    key: numberKey(match[0]),
    raw: match[0],
    start: match.index!,
    end: match.index! + match[0].length,
  }));
  const words = tokens.map((token) => token.key);
  const normalizedText = words.join(' ');
  const offsets: number[] = [];
  let offset = 0;
  for (const word of words) {
    offsets.push(offset);
    offset += word.length + 1;
  }

  function findPattern(source: string): TokenSpan[] {
    let expression = expressions.get(source);
    if (!expression) {
      expression = new RegExp(`(?<!\\S)(?:${source})(?!\\S)`, 'gu');
      expressions.set(source, expression);
    }
    return [...normalizedText.matchAll(expression)].map((match) => {
      const from = offsets.indexOf(match.index!);
      const endOffset = match.index! + match[0].length;
      const nextToken = offsets.findIndex((value) => value >= endOffset);
      return { from, to: nextToken < 0 ? tokens.length : nextToken };
    });
  }
  const originalText = (span: TokenSpan): string =>
    text.slice(tokens[span.from]?.start ?? 0, tokens[span.to - 1]?.end ?? text.length);
  const teamNames: TeamReference[] = teams.slice(0, 2).flatMap((name, index) => {
    if (!name.trim()) {
      return [];
    }
    const team = index === 0 ? ('equipo1' as const) : ('equipo2' as const);
    return findPattern(escapePattern(numberKey(name))).map((span) => ({ ...span, team }));
  });
  const teamReferences: TeamReference[] = [
    ...teamNames,
    ...findPattern(rules.own).map((span) => ({ ...span, team: 'equipo1' as const })),
    ...findPattern(rules.opponent).map((span) => ({ ...span, team: 'equipo2' as const })),
  ].filter(
    (reference) =>
      !teamNames.some((name) => overlaps(name, reference) && !contains(reference, name)),
  );
  const knownNames = players
    .filter((player) => player.name.trim())
    .flatMap((player) => findPattern(escapePattern(numberKey(player.name))));
  return {
    text,
    language,
    rules,
    players,
    tokens,
    words,
    normalizedText,
    findPattern,
    originalText,
    teamNames,
    teamReferences,
    knownNames,
    correction: findPattern(rules.correction).at(-1),
  };
}
