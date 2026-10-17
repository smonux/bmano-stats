import type { Language } from '../../i18n';
import { numberKey } from './key';
import { units, teens, tens, frenchDecade } from './spelling';

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
