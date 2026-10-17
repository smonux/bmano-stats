import { expect, test } from 'vitest';
import type { Language } from '../i18n';
import { interpretDeterministically as parse } from './deterministic';
import { teams, utterances, goldenNumbers } from './fixtures/utterances';
import { parseSpokenNumber, spokenNumber } from './numbers';

for (const language of Object.keys(utterances) as Language[]) {
  test(`${language}: every shirt 0–99 in digits and Whistle's spoken hints`, () => {
    for (let n = 0; n < 100; n++) {
      const text = utterances[language].gol;
      expect(parse(text.replace('21', String(n)), language, teams).proposal, text).toMatchObject({
        evento: 'gol',
        equipo: 'equipo1',
        dorsal: n,
      });
      expect(
        parse(text.replace('21', spokenNumber(n, language)), language, teams).proposal,
        spokenNumber(n, language),
      ).toMatchObject({ evento: 'gol', equipo: 'equipo1', dorsal: n });
    }
  });
}

test('independent word spellings, French regional numbers and range rejection', () => {
  for (const language of Object.keys(goldenNumbers) as Language[]) {
    for (const [n, text] of Object.entries(goldenNumbers[language])) {
      expect(parseSpokenNumber(text, language), text).toBe(Number(n));
    }
  }
  for (const [text, n] of [
    ['septante et un', 71],
    ['huitante', 80],
    ['octante', 80],
    ['nonante-neuf', 99],
  ] as const) {
    expect(parseSpokenNumber(text, 'fr')).toBe(n);
  }
  for (const text of [
    '100',
    '123',
    '1.5',
    '-1',
    'one hundred',
    'ciento veintitrés',
    'tres cuatro',
  ]) {
    expect(parseSpokenNumber(text, 'es')).toBeUndefined();
  }
});

test('gender and ASR-split compound numbers keep their full value', () => {
  const cases: [Language, string, number][] = [
    ['es', 'veinti seis', 26],
    ['es', 'treinta y una', 31],
    ['es', 'noventa y un', 91],
    ['fr', 'vingt et une', 21],
    ['fr', 'soixante et une', 61],
    ['fr', 'quatre-vingt-une', 81],
    ['it', 'ventuna', 21],
    ['pl', 'dwadzieścia dwie', 22],
    ['pl', 'trzydzieści jedna', 31],
  ];
  for (const [language, words, number] of cases) {
    expect(parseSpokenNumber(words, language), words).toBe(number);
    expect(
      parse(utterances[language].gol.replace('21', words), language, teams).proposal,
      words,
    ).toHaveProperty('dorsal', number);
  }
});
