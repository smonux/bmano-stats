import { expect, test } from 'vitest';
import { normalizeShirtNumbers } from './numbers';
test('normalizes only explicit shirt-number spans in the seven capture languages', () => {
  const cases = [
    ['es', 'Gol nuestro, dorsal siete.', 'Gol nuestro, dorsal 7.'],
    ['en', 'Our goal, number twenty one.', 'Our goal, number 21.'],
    ['de', 'Tor für uns, Nummer einundzwanzig.', 'Tor für uns, Nummer 21.'],
    ['fr', 'But pour nous, numéro quatre-vingt-dix-neuf.', 'But pour nous, numéro 99.'],
    ['it', 'Gol nostro numero ventotto.', 'Gol nostro numero 28.'],
    ['nl', 'Doelpunt voor ons, rugnummer tweeëntwintig.', 'Doelpunt voor ons, rugnummer 22.'],
    ['pl', 'Nasza bramka, numer dziewięćdziesiąt dziewięć.', 'Nasza bramka, numer 99.'],
  ] as const;
  for (const [language, text, expected] of cases) {
    expect(normalizeShirtNumbers(text, language)).toBe(expected);
  }
  expect(normalizeShirtNumbers('Gol de Siete, dorsal cero, asistencia de Ana.', 'es')).toBe(
    'Gol de Siete, dorsal 0, asistencia de Ana.',
  );
  expect(normalizeShirtNumbers('number one hundred', 'en')).toBe('number one hundred');
  expect(normalizeShirtNumbers('dorsal tres cuatro', 'es')).toBe('dorsal tres cuatro');
  expect(normalizeShirtNumbers('No es gol. Siete metros. Número de Juan.', 'es')).toBe(
    'No es gol. Siete metros. Número de Juan.',
  );
});
