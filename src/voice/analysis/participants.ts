import { numberAt, numberKey } from '../numbers';
import { escapePattern } from './context';
import { contains, overlaps, markTokens } from './spans';
import type {
  AnalysisContext,
  DetectedEvent,
  PlayerMention,
  RelationMarkers,
  TokenSpan,
} from './types';

const MAX_NAME_NUMBER_DISTANCE = 3;
const MAX_PERSON_NAME_TOKENS = 5;
const NAME_PARTICLES = new Set(['de', 'del', 'da', 'di', 'van', 'von', 'der', 'la', 'le']);

export type Participants = {
  mentions: PlayerMention[];
  numbers: PlayerMention[];
  markers: RelationMarkers;
};

export function extractParticipants(
  context: AnalysisContext,
  detected: DetectedEvent,
  warnings: string[],
): Participants {
  const { rules, findPattern, teamReferences } = context;
  const occupied = new Set<number>();
  const occupy = (span: TokenSpan) => markTokens(occupied, span);
  [
    ...detected.candidates,
    ...teamReferences,
    ...findPattern([rules.shirt, rules.timePrefix, rules.units, rules.correction].join('|')),
  ].forEach(occupy);
  const numbers = collectShirtNumbers(context, detected, warnings, occupy);
  const markers = findRelationMarkers(context, detected);
  [
    ...markers.after,
    ...markers.before,
    ...(detected.event === 'sustitucion' ? markers.barriers : []),
  ].forEach(occupy);
  const names = collectPlayerNames(context, occupied, occupy);
  return { mentions: mergeNamesAndNumbers(names, numbers, markers.barriers), numbers, markers };
}

function collectShirtNumbers(
  context: AnalysisContext,
  detected: DetectedEvent,
  warnings: string[],
  occupy: (span: TokenSpan) => void,
): PlayerMention[] {
  const {
    tokens,
    words,
    text,
    language,
    rules,
    findPattern,
    teamReferences,
    knownNames,
    correction,
  } = context;
  const candidates = detected.candidates;
  const numbers: PlayerMention[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const match = numberAt(words, i, language);
    if (!match) {
      continue;
    }
    const span = { from: i, to: match.end };
    occupy(span);
    i = match.end - 1;
    if (
      teamReferences.some((ref) => overlaps(ref, span)) ||
      knownNames.some((name) => overlaps(name, span)) ||
      candidates.some((cue) => contains(cue, span))
    ) {
      continue;
    }
    const previous = words[span.from - 1] ?? '';
    const next = words[span.to] ?? '';
    const is = (source: string, value: string) => new RegExp(`^(?:${source})$`, 'u').test(value);
    const preceding = text.slice(Math.max(0, tokens[span.from].start - 1), tokens[span.from].start);
    const previousNumeric = span.from > 0 && /^\d+$/.test(previous);
    const nextNumeric = /^\d+$/.test(next);
    const punctuation = previousNumeric
      ? text.slice(tokens[span.from - 1].end, tokens[span.from].start)
      : nextNumeric
        ? text.slice(tokens[span.to - 1].end, tokens[span.to].start)
        : '';
    if (
      is(rules.timePrefix, previous) ||
      is(rules.units, next) ||
      /[-−+]/u.test(preceding) ||
      (/[.,:]/u.test(punctuation) && (previousNumeric || nextNumeric))
    ) {
      continue;
    }
    // Score pairs written as 12-10, 12:10 or 12 to 10 aren't shirts.
    const afterNumber = numberAt(words, span.to + 1, language);
    const beforeNumber = span.from >= 2 ? numberAt(words, span.from - 2, language) : undefined;
    if (
      (/^(?:a|to|zu|do)$/u.test(next) && afterNumber) ||
      (/^(?:a|to|zu|do)$/u.test(previous) && beforeNumber)
    ) {
      continue;
    }
    if (correction && span.to <= correction.from) {
      continue;
    }
    const explicitShirt =
      findPattern(rules.shirt).some(
        (marker) => marker.to <= span.from && span.from - marker.to <= 1,
      ) || text[tokens[span.from].start - 1] === '#';
    if (match.value === 1 && !explicitShirt) {
      const article = rules.articles;
      if (article.includes(words[span.from]) || /^(?:of|de|z)$/u.test(next)) {
        continue;
      }
    }
    if (match.value === undefined) {
      warnings.push('Hay un dorsal fuera de 0–99 o un número ambiguo; no se ha asignado.');
      continue;
    }
    numbers.push({ ...span, shirtNumber: match.value });
  }
  return numbers;
}

function findRelationMarkers(context: AnalysisContext, detected: DetectedEvent): RelationMarkers {
  const { rules, words, language, findPattern } = context;
  const {
    event,
    substitution: { outgoing, incoming, connectors },
  } = detected;
  const relation = rules.relation[event];
  const after = relation
    ? findPattern(relation.after).filter((marker) => {
        if (event !== 'penalti_cometido') {
          return true;
        }
        if (
          language === 'es' &&
          words[marker.from] === 'contra' &&
          words[marker.from - 1] === 'en'
        ) {
          return false;
        }
        if (
          rules.recipientPrepositions.includes(words[marker.from]) &&
          marker.to - marker.from === 1 &&
          !findPattern(rules.committingVerbs).some((span) => span.to <= marker.from)
        ) {
          return false;
        }
        return true;
      })
    : [];
  const before = relation ? findPattern(relation.before) : [];
  const roleBarriers = event === 'sustitucion' ? [...outgoing, ...incoming, ...connectors] : after;
  return { after, before, barriers: roleBarriers };
}

function collectPlayerNames(
  context: AnalysisContext,
  occupied: Set<number>,
  occupy: (span: TokenSpan) => void,
): PlayerMention[] {
  const { players, rules, tokens, words, text, teamReferences, findPattern, originalText } =
    context;
  const stop = new Set(rules.stopWords);
  const names: PlayerMention[] = [];
  for (const player of [...players].sort((a, b) => b.name.length - a.name.length)) {
    if (!player.name.trim()) {
      continue;
    }
    for (const span of findPattern(escapePattern(numberKey(player.name)))) {
      if (
        names.some((name) => overlaps(name, span)) ||
        teamReferences.some((ref) => overlaps(ref, span))
      ) {
        continue;
      }
      names.push({ ...span, name: originalText(span) });
      occupy(span);
    }
  }
  // Ground unknown names in literal proper-name spans; lower-case roster names work above.
  for (let i = 0; i < tokens.length; i++) {
    if (
      occupied.has(i) ||
      stop.has(words[i]) ||
      !/^\p{Lu}/u.test(tokens[i].raw) ||
      !/^\p{L}+$/u.test(tokens[i].raw)
    ) {
      continue;
    }
    let end = i + 1;
    while (
      end < tokens.length &&
      end - i < MAX_PERSON_NAME_TOKENS &&
      !/[,;.!?]/u.test(text.slice(tokens[end - 1].end, tokens[end].start)) &&
      !occupied.has(end) &&
      (/^\p{Lu}/u.test(tokens[end].raw) || NAME_PARTICLES.has(words[end]))
    ) {
      if (stop.has(words[end]) && !NAME_PARTICLES.has(words[end])) {
        break;
      }
      end++;
    }
    while (end > i + 1 && NAME_PARTICLES.has(words[end - 1])) {
      end--;
    }
    const span = { from: i, to: end };
    names.push({ ...span, name: originalText(span) });
    occupy(span);
    i = end - 1;
  }
  return names;
}

function mergeNamesAndNumbers(
  names: PlayerMention[],
  numbers: PlayerMention[],
  roleBarriers: TokenSpan[],
): PlayerMention[] {
  const entities: PlayerMention[] = [...names];
  for (const number of numbers) {
    const nearby = names.filter(
      (name) =>
        mentionDistance(name, number) <= MAX_NAME_NUMBER_DISTANCE &&
        !roleBarriers.some(
          (marker) =>
            marker.from >= Math.min(name.to, number.to) &&
            marker.to <= Math.max(name.from, number.from),
        ),
    );
    nearby.sort((a, b) => mentionDistance(a, number) - mentionDistance(b, number));
    const name = nearby[0];
    if (name && name.shirtNumber === undefined) {
      name.shirtNumber = number.shirtNumber;
      name.from = Math.min(name.from, number.from);
      name.to = Math.max(name.to, number.to);
    } else {
      entities.push(number);
    }
  }
  entities.sort((a, b) => a.from - b.from);
  return entities;
}

function mentionDistance(left: TokenSpan, right: TokenSpan): number {
  return Math.min(Math.abs(left.to - right.from), Math.abs(right.to - left.from));
}
