import type { Language } from '../../i18n';
import { languageRules } from '../languages';

// Number spellings live beside the other vocabulary for each language.
export const units = Object.fromEntries(
  Object.entries(languageRules).map(([language, rules]) => [language, rules.numbers.units]),
) as Record<Language, readonly string[]>;
export const teens = Object.fromEntries(
  Object.entries(languageRules).map(([language, rules]) => [language, rules.numbers.teens]),
) as Record<Language, readonly string[]>;
export const tens = Object.fromEntries(
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

export function frenchDecade(decade: string, unitNumber: number, unit: string): string {
  if (unitNumber === 1) {
    return decade + ' et un';
  }
  if (unitNumber > 0) {
    return decade + ' ' + unit;
  }
  return decade;
}
