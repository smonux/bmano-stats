import type { Language } from '../i18n';
import { languageRules } from './languages';

export const numberKey = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

// Number spellings live beside the other vocabulary for each language.
const units = Object.fromEntries(
  Object.entries(languageRules).map(([language, rules]) => [language, rules.numbers.units]),
) as Record<Language, readonly string[]>;
const teens = Object.fromEntries(
  Object.entries(languageRules).map(([language, rules]) => [language, rules.numbers.teens]),
) as Record<Language, readonly string[]>;
const tens = Object.fromEntries(
  Object.entries(languageRules).map(([language, rules]) => [language, rules.numbers.tens]),
) as Record<Language, readonly string[]>;
/** Canonical spelling for the vocabulary hints sent to Whistle. */
export function spokenNumber(number: number, language: Language): string {
  if (!Number.isInteger(number) || number < 0 || number > 99) {
    throw new RangeError('Shirt number must be 0–99');
  }
  if (number < 10) {
    return units[language][number];
  }
  if (number < 20) {
    return teens[language][number - 10];
  }
  const unitNumber = number % 10;
  const decade = tens[language][Math.floor(number / 10) - 2];
  const unit = units[language][unitNumber];
  if (language === 'fr') {
    return frenchNumber(number, decade, unitNumber, unit);
  }
  if (unitNumber === 0) {
    return decade;
  }
  if (language === 'es') {
    if (number < 30) {
      return { 22: 'veintidós', 23: 'veintitrés', 26: 'veintiséis' }[number] ?? 'veinti' + unit;
    }
    return decade + ' y ' + unit;
  }
  if (language === 'de') {
    return (unitNumber === 1 ? 'ein' : unit) + 'und' + decade;
  }
  if (language === 'nl') {
    return unit + ([2, 3].includes(unitNumber) ? 'ën' : 'en') + decade;
  }
  if (language === 'it') {
    const stem = unitNumber === 1 || unitNumber === 8 ? decade.slice(0, -1) : decade;
    const spelling = stem + unit;
    return unitNumber === 3 ? spelling.slice(0, -1) + 'é' : spelling;
  }
  return decade + ' ' + unit;
}

function frenchNumber(number: number, decade: string, unitNumber: number, unit: string): string {
  if (number < 70) {
    return frenchDecade(decade, unitNumber, unit);
  }
  if (number < 80) {
    return 'soixante' + (number === 71 ? ' et ' : ' ') + teens.fr[number - 70];
  }
  if (number === 80) {
    return 'quatre-vingts';
  }
  const remainder = number < 90 ? unit : teens.fr[number - 90].replaceAll(' ', '-');
  return 'quatre-vingt-' + remainder;
}

function frenchDecade(decade: string, unitNumber: number, unit: string): string {
  if (unitNumber === 1) {
    return decade + ' et un';
  }
  if (unitNumber > 0) {
    return decade + ' ' + unit;
  }
  return decade;
}

const dictionaries = new Map<Language, Map<string, number>>();
export function numberDictionary(language: Language): ReadonlyMap<string, number> {
  const cached = dictionaries.get(language);
  if (cached) {
    return cached;
  }
  const result = new Map<string, number>();
  const add = (word: string, n: number) => result.set(numberKey(word), n);
  units[language].forEach((word, n) => add(word, n));
  teens[language].forEach((word, n) => add(word, n + 10));
  for (let n = 20; n < 100; n++) {
    const decade = tens[language][Math.floor(n / 10) - 2];
    const unitNumber = n % 10;
    const unit = units[language][unitNumber];
    let word = decade + (unitNumber ? ' ' + unit : '');
    if (language === 'es' && unitNumber) {
      word = n < 30 ? 'veinti' + unit : decade + ' y ' + unit;
      if (n < 30) {
        add('veinti ' + unit, n);
      }
    }
    if (language === 'de' && unitNumber) {
      word = (unitNumber === 1 ? 'ein' : unit) + 'und' + decade;
      add((unitNumber === 1 ? 'ein' : unit) + ' und ' + decade, n);
    }
    if (language === 'nl' && unitNumber) {
      word = unit + 'en' + decade;
      add(unit + ' en ' + decade, n);
    }
    if (language === 'it' && unitNumber) {
      word = (unitNumber === 1 || unitNumber === 8 ? decade.slice(0, -1) : decade) + unit;
      add((unitNumber === 1 || unitNumber === 8 ? decade.slice(0, -1) : decade) + ' ' + unit, n);
    }
    if (language === 'fr') {
      if (n < 70) {
        word = frenchDecade(decade, unitNumber, unit);
      } else if (n < 80) {
        word = 'soixante' + (n === 71 ? ' et ' : ' ') + teens.fr[n - 70];
      } else {
        word = n === 80 ? 'quatre vingts' : 'quatre vingt ' + (n < 90 ? unit : teens.fr[n - 90]);
      }
      if (n >= 70) {
        add(frenchDecade(decade, unitNumber, unit), n);
        if (n < 90) {
          add(frenchDecade('octante', unitNumber, unit), n);
        }
      }
    }
    add(word, n);
  }
  if (language === 'es') {
    add('un', 1);
    add('una', 1);
    add('veintiún', 21);
    add('veintiuna', 21);
  }
  if (language === 'en') {
    add('oh', 0);
    add('nought', 0);
  }
  if (language === 'fr') {
    add('une', 1);
    add('quatre vingt', 80);
  }
  if (language === 'de') {
    add('ein', 1);
    add('eine', 1);
  }
  if (language === 'pl') {
    add('jedna', 1);
    add('jedno', 1);
    add('dwie', 2);
  }
  // Spoken gender/apocope variants of the unit in compound shirt numbers.
  for (const [word, number] of [...result]) {
    if (language === 'es' && number % 10 === 1 && number >= 20) {
      add(word.replace(/uno$/u, 'un'), number);
      add(word.replace(/uno$/u, 'una'), number);
    }
    if (language === 'fr' && /un$/u.test(word)) {
      add(word.replace(/un$/u, 'une'), number);
    }
    if (language === 'it' && /uno$/u.test(word)) {
      add(word.replace(/uno$/u, 'una'), number);
      add(word.replace(/uno$/u, 'un'), number);
    }
    if (language === 'pl' && /jeden$/u.test(word)) {
      add(word.replace(/jeden$/u, 'jedna'), number);
      add(word.replace(/jeden$/u, 'jedno'), number);
    }
    if (language === 'pl' && /dwa$/u.test(word)) {
      add(word.replace(/dwa$/u, 'dwie'), number);
    }
  }
  dictionaries.set(language, result);
  return result;
}
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
