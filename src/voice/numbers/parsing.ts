import type { Language } from '../../i18n';
import { numberKey } from './key';
import { numberDictionary } from './dictionary';

/** Exact complete span only: 123, 1.5, -1 and one hundred never become shirt 23/1. */
export function parseSpokenNumber(text: string, language: Language): number | undefined {
  if (/^\d{1,2}$/.test(text.trim())) {
    return Number(text);
  }
  if (/[\d.,+−]/u.test(text) || /^\s*-/.test(text)) {
    return undefined;
  }
  return numberDictionary(language).get(numberKey(text));
}
export type NumberSpan = { start: number; end: number; value: number | undefined };
const LARGE_NUMBER_WORDS =
  /^(?:hundred|thousand|million|hundert|tausend|cien|ciento|mil|cent|mille|cento|mila|honderd|duizend|sto|tysiac)$/u;
const MAX_NUMBER_WORDS = 6;
/** Longest complete number, including spaced ASR compounds. Invalid spans stay invalid. */
export function numberAt(
  words: readonly string[],
  start: number,
  language: Language,
): NumberSpan | undefined {
  const dictionary = numberDictionary(language);
  const first = words[start];
  if (first === undefined) {
    return undefined;
  }
  if (/^\d+$/.test(first)) {
    return { start, end: start + 1, value: first.length <= 2 ? Number(first) : undefined };
  }
  if (LARGE_NUMBER_WORDS.test(first)) {
    let end = start + 1;
    while (
      end < words.length &&
      (dictionary.has(words[end]) ||
        /^\d+$/.test(words[end]) ||
        LARGE_NUMBER_WORDS.test(words[end]))
    ) {
      end++;
    }
    return { start, end, value: undefined };
  }
  for (let size = Math.min(MAX_NUMBER_WORDS, words.length - start); size > 0; size--) {
    const value = dictionary.get(words.slice(start, start + size).join(' '));
    if (value === undefined) {
      continue;
    }
    let end = start + size;
    // Prevent a partial reading of 'one hundred' or 'three four'.
    if (
      LARGE_NUMBER_WORDS.test(words[end] ?? '') ||
      dictionary.has(words[end] ?? '') ||
      /^\d+$/.test(words[end] ?? '')
    ) {
      while (
        end < words.length &&
        (dictionary.has(words[end]) ||
          LARGE_NUMBER_WORDS.test(words[end]) ||
          /^\d+$/.test(words[end]))
      ) {
        end++;
      }
      return { start, end, value: undefined };
    }
    return { start, end, value };
  }
  return undefined;
}
