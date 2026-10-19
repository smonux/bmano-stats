import { numberAt, numberKey } from '../numbers';
import type {
  AnalysisContext,
  PlayerMention,
  RulePlayer,
  TeamPerspective,
  TokenSpan,
} from '../analysis/types';
import { commandVocabulary } from './vocabulary';
import { levenshtein } from './distance';

type Alias = { key: string; words: string[]; player: RulePlayer };

/** One left-to-right pass: roster membership never promotes a later mention. */
export function commandPlayers(
  context: AnalysisContext,
  start: number,
  teams: TeamPerspective[],
  excluded: TokenSpan[],
  warnings: string[],
): PlayerMention[] {
  const mentions: PlayerMention[] = [];
  const stop = new Set(context.rules.stopWords);
  const vocabulary = commandVocabulary[context.language];
  const units = new RegExp(`^(?:${vocabulary.minutes}|${vocabulary.metres})$`, 'u');
  const aliases: Alias[] = context.players.flatMap((player) => {
    const key = numberKey(player.name);
    return [...new Set([key, ...key.split(' ').filter((part) => !stop.has(part))])]
      .filter(Boolean)
      .map((key) => ({ key, words: key.split(' '), player }));
  });
  for (let from = start; from < context.words.length && mentions.length < teams.length; from++) {
    if (excluded.some((span) => span.from <= from && span.to > from)) continue;
    const number = numberAt(context.words, from, context.language, true);
    // Units also take precedence over roster names such as «Dos» or «Nueve».
    if (
      number &&
      (units.test(context.words[number.end] ?? '') ||
        new RegExp(`^(?:${context.rules.timePrefix})$`, 'u').test(context.words[from - 1] ?? ''))
    ) {
      from = number.end - 1;
      continue;
    }
    const pool = aliases.filter(({ player }) => player.team === teams[mentions.length]);
    const literal = pool
      .filter(
        (alias) =>
          context.words.slice(from, from + alias.words.length).join(' ') === alias.key &&
          !excluded.some((span) => span.from < from + alias.words.length && span.to > from),
      )
      .sort((a, b) => b.words.length - a.words.length);
    const name = uniqueName(
      literal.filter((alias) => alias.words.length === literal[0]?.words.length),
    );
    if (name) {
      mentions.push(mention(name, from));
      from += name.words.length - 1;
      continue;
    }
    if (number) {
      const next = context.words[number.end] ?? '';
      const previous = context.words[from - 1] ?? '';
      const span = { from, to: number.end };
      const textBefore = context.text.slice(
        Math.max(0, context.tokens[from].start - 1),
        context.tokens[from].start,
      );
      const followingPunctuation = context.tokens[number.end]
        ? context.text.slice(context.tokens[number.end - 1].end, context.tokens[number.end].start)
        : '';
      const valid =
        number.value !== undefined &&
        !units.test(next) &&
        !new RegExp(`^(?:${context.rules.timePrefix})$`, 'u').test(previous) &&
        !/[-+−.:]/u.test(textBefore) &&
        !(/^\d+$/u.test(next) && /[.:-]/u.test(followingPunctuation)) &&
        !excluded.some((occupied) => occupied.from < span.to && occupied.to > span.from);
      if (valid) mentions.push({ ...span, shirtNumber: number.value });
      from = number.end - 1;
      continue;
    }
    if (stop.has(context.words[from]) || context.words[from].length < 4) continue;
    const candidates = pool
      .flatMap((alias) => {
        if (alias.key.replaceAll(' ', '').length < 4) return [];
        const to = from + alias.words.length;
        if (excluded.some((span) => span.from < to && span.to > from)) return [];
        const value = context.words.slice(from, to).join(' ');
        const limit = alias.key.length > 7 ? 3 : alias.key.length > 4 ? 2 : 1;
        const distance = levenshtein(value, alias.key);
        return distance <= limit ? [{ alias, distance }] : [];
      })
      .sort((a, b) => a.distance - b.distance);
    const best = candidates[0];
    if (!best) continue;
    const approximate = uniqueName(
      candidates.filter(({ distance }) => distance === best.distance).map(({ alias }) => alias),
    );
    if (!approximate) continue;
    mentions.push(mention(approximate, from));
    warnings.push('Jugador reconocido por aproximación de nombre. Revisa el dorsal.');
    from += approximate.words.length - 1;
  }
  return mentions;
}

function uniqueName(aliases: Alias[]): Alias | undefined {
  return new Set(aliases.map(({ player }) => player)).size === 1 ? aliases[0] : undefined;
}
function mention(alias: Alias, from: number): PlayerMention {
  return {
    from,
    to: from + alias.words.length,
    name: alias.player.name,
    ...(alias.player.dorsal !== null && alias.player.dorsal !== undefined
      ? { shirtNumber: alias.player.dorsal }
      : {}),
  };
}
