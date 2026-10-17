import { expect, test } from 'vitest';
import type { Language } from '../i18n';
import { interpretDeterministically as parse } from './deterministic';
import { teams, utterances } from './fixtures/utterances';

for (const language of Object.keys(utterances) as Language[]) {
  test(`${language}: all 12 events and recorder perspective`, () => {
    Object.entries(utterances[language]).forEach(([event, text]) => {
      const result = parse(text, language, teams).proposal;
      expect(result, text).toMatchObject({
        evento: event,
        equipo: 'equipo1',
        ...(event === 'pasivo' ? {} : { dorsal: 21 }),
      });
    });
  });
}

test('penalty and discipline metadata do not leak to other event types', () => {
  expect(parse('Gol nuestro siete de penalti', 'es', teams).proposal).toMatchObject({
    evento: 'gol',
    dorsal: 7,
    penalti: true,
  });
  expect(parse('Gol nuestro siete', 'es', teams).proposal).not.toHaveProperty('penalti');
  expect(parse('Descalificación rival seis tarjeta azul', 'es', teams).proposal).toMatchObject({
    evento: 'descalificacion',
    equipo: 'equipo2',
    dorsal: 6,
    azul: true,
  });
  expect(parse('Exclusión nuestra dos minutos', 'es', teams).proposal).toEqual({
    evento: 'exclusion',
    equipo: 'equipo1',
  });
  expect(parse('Pasivo nuestro dorsal seis', 'es', teams).proposal).toEqual({
    evento: 'pasivo',
    equipo: 'equipo1',
  });
  for (const [word, infraccion] of [
    ['pasos', 'Pasos'],
    ['dobles', 'Dobles'],
    ['pisando', 'Pisando'],
  ]) {
    expect(parse(word + ' nuestro seis', 'es', teams).proposal).toMatchObject({
      evento: 'infraccion',
      infraccion,
    });
  }
  expect(parse('Infracción nuestra seis', 'es', teams).proposal).not.toHaveProperty('infraccion');
});

test('rejects cancellations, multiple actions and non-play commentary; numbers are contextual', () => {
  for (const text of [
    'No ha sido gol nuestro',
    'Gol nuestro y pérdida rival',
    'Gol nuestro y gol rival',
    'La camiseta azul es bonita',
    'Vamos 12 a 10',
    'Quedan dos minutos',
    '¿Ha sido gol de ellos?',
    'Buen pase de Marta',
    'El pabellón está lleno',
  ]) {
    expect(parse(text, 'es', teams).proposal, text).toBeNull();
  }
  for (const text of [
    'Gol nuestro minuto seis',
    'Gol nuestro 12:10',
    'Gol nuestro dorsal ciento veintitrés',
    'Gol nuestro dorsal 123',
    'Gol nuestro un tanto',
  ]) {
    expect(parse(text, 'es', teams).proposal, text).not.toHaveProperty('dorsal');
  }
  expect(parse('Gol del seis, perdón, del siete nuestro', 'es', teams).proposal).toMatchObject({
    dorsal: 7,
    equipo: 'equipo1',
  });
  expect(parse('Gol local seis', 'es', teams).proposal).toMatchObject({
    equipo: 'desconocido',
    dorsal: 6,
  });
});

test('opposing teams, save participants and approximate event terms across all languages', () => {
  const cases: Record<Language, [string, string, string]> = {
    es: [
      'Gol rival dorsal 21',
      'Parada rival dorsal 1 tiro de nuestro dorsal 9',
      'Exclucion nuestra dorsal 6',
    ],
    en: [
      'Their goal number 21',
      'Save their number 1 shot from our number 9',
      'Our suspenson number 6',
    ],
    de: [
      'Tor Gegner Nummer 21',
      'Parade Gegner Nummer 1 Wurf von unser Nummer 9',
      'Zeitstrfe unser Nummer 6',
    ],
    fr: [
      'But adversaire numéro 21',
      'Arrêt adversaire numéro 1 tir de notre numéro 9',
      'Exclucion notre numéro 6',
    ],
    it: [
      'Gol loro numero 21',
      'Parata loro numero 1 tiro di nostro numero 9',
      'Esclusone nostra numero 6',
    ],
    nl: [
      'Doelpunt tegenstander rugnummer 21',
      'Redding tegenstander rugnummer 1 schot van ons rugnummer 9',
      'Tijdstaf onze rugnummer 6',
    ],
    pl: [
      'Bramka rywala numer 21',
      'Obrona rywala numer 1 rzut zawodnika nasz numer 9',
      'Wyklucznie nasze numer 6',
    ],
  };
  for (const language of Object.keys(cases) as Language[]) {
    const [goal, save, typo] = cases[language];
    expect(parse(goal, language, teams).proposal, goal).toMatchObject({
      evento: 'gol',
      equipo: 'equipo2',
      dorsal: 21,
    });
    expect(parse(save, language, teams).proposal, save).toMatchObject({
      evento: 'parada',
      equipo: 'equipo2',
      dorsal: 1,
      dorsal_relacionado: 9,
    });
    const result = parse(typo, language, teams);
    expect(result.proposal, typo).toMatchObject({
      evento: 'exclusion',
      equipo: 'equipo1',
      dorsal: 6,
    });
    expect(result.eventMatch, typo).toBe('approximate');
  }
});
