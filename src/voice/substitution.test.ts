import { expect, test } from 'vitest';
import type { Language } from '../i18n';
import { interpretDeterministically as parse } from './deterministic';
import { teams } from './fixtures/utterances';

test('cambio and sustitución resolve explicit outgoing/incoming roles, either order and names', () => {
  const cases: [string, object][] = [
    [
      'Cambio del equipo uno, sale el 2 y entra el 3',
      { equipo: 'equipo1', dorsal: 2, dorsal_relacionado: 3 },
    ],
    [
      'Cambio nuestro, sale el 6 y entra el 9',
      { equipo: 'equipo1', dorsal: 6, dorsal_relacionado: 9 },
    ],
    [
      'Sustitución rival, entra el nueve por el seis',
      { equipo: 'equipo2', dorsal: 6, dorsal_relacionado: 9 },
    ],
    [
      'Sale el cero y entra el noventa y nueve de La Jota',
      { equipo: 'equipo1', dorsal: 0, dorsal_relacionado: 99 },
    ],
    ['Entra el 9 por el 6 nuestro', { equipo: 'equipo1', dorsal: 6, dorsal_relacionado: 9 }],
    [
      'Cambio nuestro, Ana sale y María entra',
      { equipo: 'equipo1', nombre: 'Ana', nombre_relacionado: 'María' },
    ],
    [
      'Cambio de ellos, entra Juan, sale Luis',
      { equipo: 'equipo2', nombre: 'Luis', nombre_relacionado: 'Juan' },
    ],
    [
      'Sustitución de Ana por María',
      { equipo: 'desconocido', nombre: 'Ana', nombre_relacionado: 'María' },
    ],
    [
      'Cambio nuestro, sale Ana dorsal 6 y entra María dorsal 9',
      {
        equipo: 'equipo1',
        nombre: 'Ana',
        dorsal: 6,
        nombre_relacionado: 'María',
        dorsal_relacionado: 9,
      },
    ],
  ];
  for (const [text, expected] of cases) {
    expect(parse(text, 'es', teams).proposal, text).toEqual({ evento: 'sustitucion', ...expected });
  }
  expect(parse('Cambio nuestro, entra el 9', 'es', teams).proposal).toEqual({
    evento: 'sustitucion',
    equipo: 'equipo1',
    dorsal_relacionado: 9,
  });
  expect(parse('Cambio rival, sale el 6', 'es', teams).proposal).toEqual({
    evento: 'sustitucion',
    equipo: 'equipo2',
    dorsal: 6,
  });
  expect(parse('Sustituición nuestra, sale 6 entra 9', 'es', teams).proposal).toMatchObject({
    evento: 'sustitucion',
    dorsal: 6,
    dorsal_relacionado: 9,
  });
  const unclear = parse('Cambio nuestro 6 y 9', 'es', teams);
  expect(unclear.proposal).toEqual({ evento: 'sustitucion', equipo: 'equipo1' });
  expect(unclear.warnings.join(' ')).toContain('quién sale');
  expect(parse('Cambio nuestro, sale el 6 rival, entra el 9', 'es', teams).proposal).toHaveProperty(
    'equipo',
    'desconocido',
  );
});

test('substitutions do not convert non-play changes, ball movement or multiple actions into a substitution', () => {
  for (const text of [
    'Cambio de tiempo',
    'Cambio de idioma',
    'Cambio de equipo',
    'Entra el balón en el área',
    'No hay cambio nuestro',
    'Cambio nuestro sale 6 entra 9, sale 8 entra 12',
    'Cambio nuestro y gol rival',
  ]) {
    expect(parse(text, 'es', teams).proposal, text).toBeNull();
  }
  expect(parse('Gol nuestro, entra el balón', 'es', teams).proposal).toEqual({
    evento: 'gol',
    equipo: 'equipo1',
  });
});

test('incoming-first substitution phrases across every capture language preserve roles', () => {
  const cases: Record<Language, string> = {
    es: 'Cambio rival, entra el 9 por el 6',
    en: 'Their substitution, number 9 on for number 6',
    de: 'Wechsel Gegner, Nummer 9 rein für Nummer 6',
    fr: 'Changement adversaire, le numéro 9 entre, le numéro 6 sort',
    it: 'Cambio loro, entra il numero 9, esce il numero 6',
    nl: 'Wissel tegenstander, rugnummer 9 erin voor rugnummer 6',
    pl: 'Zmiana rywala, wchodzi numer 9 za numer 6',
  };
  for (const language of Object.keys(cases) as Language[]) {
    expect(parse(cases[language], language, teams).proposal, cases[language]).toEqual({
      evento: 'sustitucion',
      equipo: 'equipo2',
      dorsal: 6,
      dorsal_relacionado: 9,
    });
  }
});
