import type { Language } from '../i18n';
import type { SpokenEvent } from './event-types';
import { numberKey } from './numbers';
import { languageRules } from './languages';

const MIN_CANDIDATE_LENGTH = 4;
const MIN_PREFIX_LENGTH = 5;
const MIN_PREFIX_COVERAGE = 0.55;
const PREFIX_SCORE = 0.8;
const MIN_COMPETING_EVENT_GAP = 0.12;
const LONG_ALIAS_LENGTH = 9;

type Candidate = { event: SpokenEvent; from: number; to: number; score: number };

/** Edit distance with adjacent transpositions, as commonly produced by ASR spelling errors. */
function editDistance(left: string, right: string): number {
  const distances = Array.from({ length: left.length + 1 }, (_, index) => [
    index,
    ...Array(right.length).fill(0),
  ]);
  for (let rightIndex = 0; rightIndex <= right.length; rightIndex++) {
    distances[0][rightIndex] = rightIndex;
  }
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const deletion = distances[leftIndex - 1][rightIndex] + 1;
      const insertion = distances[leftIndex][rightIndex - 1] + 1;
      const substitution =
        distances[leftIndex - 1][rightIndex - 1] +
        Number(left[leftIndex - 1] !== right[rightIndex - 1]);
      distances[leftIndex][rightIndex] = Math.min(deletion, insertion, substitution);
      const transposed =
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1];
      if (transposed) {
        distances[leftIndex][rightIndex] = Math.min(
          distances[leftIndex][rightIndex],
          distances[leftIndex - 2][rightIndex - 2] + 1,
        );
      }
    }
  }
  return distances[left.length][right.length];
}

/** Fallback for event keywords only; known player/team spans are excluded by the caller. */
export function approximateEvent(
  words: readonly string[],
  language: Language,
  excluded: ReadonlySet<number>,
): Candidate | undefined {
  const candidates: Candidate[] = [];
  const vocabulary = Object.entries(languageRules[language].approximateAliases) as [
    SpokenEvent,
    readonly string[],
  ][];
  for (const [event, aliases] of vocabulary) {
    for (const alias of aliases) {
      const reference = numberKey(alias);
      const wordCount = reference.split(' ').length;
      for (let from = 0; from + wordCount <= words.length; from++) {
        const to = from + wordCount;
        if (wordsAreExcluded(from, to, excluded)) {
          continue;
        }
        const value = words.slice(from, to).join(' ');
        if (value.length < MIN_CANDIDATE_LENGTH) {
          continue;
        }
        const prefix =
          wordCount === 1 &&
          value.length >= MIN_PREFIX_LENGTH &&
          reference.startsWith(value) &&
          value.length / reference.length >= MIN_PREFIX_COVERAGE;
        if (Math.abs(value.length - reference.length) > 2 && !prefix) {
          continue;
        }
        const edits = editDistance(value, reference);
        const allowedEdits = reference.length >= LONG_ALIAS_LENGTH ? 2 : 1;
        if (edits > allowedEdits && !prefix) {
          continue;
        }
        const score = prefix ? PREFIX_SCORE : 1 - edits / Math.max(reference.length, value.length);
        candidates.push({ event, from, to, score });
      }
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.from - right.from);
  const best = candidates[0];
  if (!best) {
    return undefined;
  }
  const ambiguous = candidates.some(
    (candidate) =>
      candidate.event !== best.event && best.score - candidate.score < MIN_COMPETING_EVENT_GAP,
  );
  if (ambiguous) {
    return undefined;
  }
  return best;
}

function wordsAreExcluded(from: number, to: number, excluded: ReadonlySet<number>): boolean {
  for (let index = from; index < to; index++) {
    if (excluded.has(index)) {
      return true;
    }
  }
  return false;
}
