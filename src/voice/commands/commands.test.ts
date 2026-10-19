import { expect, test } from 'vitest';
import type { Language } from '../../i18n';
import { spokenNumber } from '../numbers';
import { interpretCommand as parse } from './index';
import type { RulePlayer } from '../analysis/types';

const teams = ['La Jota', 'Rival'];
const roster: RulePlayer[] = [
  { name: 'Ana', dorsal: 7, team: 'equipo1' },
  { name: 'Eva', dorsal: 9, team: 'equipo1' },
  { name: 'Lars', dorsal: 4, team: 'equipo1' },
  { name: 'Carlos', dorsal: 6, team: 'equipo1' },
  { name: 'Alejandro', dorsal: 8, team: 'equipo1' },
  { name: 'Ana', dorsal: 3, team: 'equipo2' },
];
const command = (text: string) => parse(text, 'es', teams, roster).proposal;

test('players retain appearance order across known/unknown numbers and names; extras are ignored', () => {
  expect(command('gol nuestro veintitrés siete')).toMatchObject({
    dorsal: 23,
    dorsal_relacionado: 7,
  });
  expect(command('gol nuestro 23 Ana')).toMatchObject({ dorsal: 23, dorsal_relacionado: 7 });
  expect(command('gol nuestro Ana 23')).toMatchObject({ dorsal: 7, dorsal_relacionado: 23 });
  expect(command('gol nuestro 23 7 9')).toEqual({
    evento: 'gol',
    equipo: 'equipo1',
    dorsal: 23,
    dorsal_relacionado: 7,
  });
  expect(command('cambio nuestro 7 9')).toMatchObject({
    evento: 'sustitucion',
    dorsal: 7,
    dorsal_relacionado: 9,
  });
  expect(command('parada nuestra 1 3')).toMatchObject({
    evento: 'parada',
    dorsal: 1,
    dorsal_relacionado: 3,
  });
  expect(command('fallo nuestro 7 9')).toEqual({ evento: 'fallo', equipo: 'equipo1', dorsal: 7 });
  expect(command('pasivo nuestro 7')).toEqual({ evento: 'pasivo', equipo: 'equipo1' });
});

test('team defaults to one, first explicit perspective wins, roster names resolve within the role team', () => {
  expect(command('gol siete')).toMatchObject({ equipo: 'equipo1', dorsal: 7 });
  expect(command('gol rival nuestro 7')).toMatchObject({ equipo: 'equipo2' });
  expect(command('gol nuestro rival 7')).toMatchObject({ equipo: 'equipo1' });
  expect(command('gol rival Ana')).toMatchObject({ equipo: 'equipo2', dorsal: 3 });
  expect(command('parada nuestra 1 Ana')).toMatchObject({ dorsal: 1, dorsal_relacionado: 3 });
});

test('names shorter than four remain exact only; approximate names use the 1/2/3 edit limits', () => {
  expect(command('gol nuestro Ana')).toMatchObject({ dorsal: 7 });
  expect(command('gol nuestro una')).toMatchObject({ dorsal: 1 });
  for (const word of ['era', 'Anx', 'Lrs'])
    expect(command(`gol nuestro ${word}`)).not.toHaveProperty('dorsal');
  expect(command('gol nuestro Lxrs')).toMatchObject({ dorsal: 4 });
  expect(command('gol nuestro Xarlxs')).toMatchObject({ dorsal: 6 });
  expect(command('gol nuestro Xlejxndrx')).toMatchObject({ dorsal: 8 });
  expect(command('gol nuestro Xxxx')).not.toHaveProperty('dorsal');
  const ambiguous = [
    { name: 'Lars', team: 'equipo1' as const, dorsal: 4 },
    { name: 'Lart', team: 'equipo1' as const, dorsal: 5 },
  ];
  expect(parse('gol nuestro Larz', 'es', teams, ambiguous).proposal).not.toHaveProperty('dorsal');
});

test('metadata, durations and distances never become players or override the first event', () => {
  expect(
    parse('gol nuestro nueve metros', 'es', teams, [{ name: 'Nueve', dorsal: 19, team: 'equipo1' }])
      .proposal,
  ).not.toHaveProperty('dorsal');
  for (const text of [
    'gol nuestro 12:10',
    'gol nuestro -7',
    'gol nuestro 123',
    'gol nuestro ciento veintitrés',
  ])
    expect(command(text)).not.toHaveProperty('dorsal');
  expect(command('tiro fallado nuestro 7')).toMatchObject({ evento: 'fallo', dorsal: 7 });
  expect(command('siete metros nuestro 7')).toMatchObject({
    evento: 'penalti_cometido',
    dorsal: 7,
  });
  expect(command('gol nuestro 7 9 penalti')).toEqual({
    evento: 'gol',
    equipo: 'equipo1',
    dorsal: 7,
    dorsal_relacionado: 9,
    penalti: true,
  });
  expect(command('parada nuestra 1 9 siete metros')).toMatchObject({
    evento: 'parada',
    dorsal: 1,
    dorsal_relacionado: 9,
    penalti: true,
  });
  expect(command('fallo nuestro 7 penalti')).toMatchObject({
    evento: 'fallo',
    dorsal: 7,
    penalti: true,
  });
  expect(command('exclusión nuestra 2 dos minutos')).toEqual({
    evento: 'exclusion',
    equipo: 'equipo1',
    dorsal: 2,
  });
  expect(command('dos minutos nuestro 9')).toMatchObject({ evento: 'exclusion', dorsal: 9 });
  expect(command('gol nuestro 7 nueve metros')).toEqual({
    evento: 'gol',
    equipo: 'equipo1',
    dorsal: 7,
  });
  expect(command('infracción nuestra 7 pasos')).toMatchObject({
    evento: 'infraccion',
    dorsal: 7,
    infraccion: 'Pasos',
  });
  expect(command('pasos nuestros 7')).toMatchObject({ evento: 'infraccion', infraccion: 'Pasos' });
  expect(command('gol nuestro 7 pérdida')).toMatchObject({ evento: 'gol', dorsal: 7 });
});

test('the command must start with its event; unsupported free-form speech stays pending', () => {
  expect(parse('col nuestro siete', 'es', teams).proposal).toMatchObject({
    evento: 'gol',
    dorsal: 7,
  });
  expect(parse('col nuestro siete', 'es', teams).eventMatch).toBe('approximate');
  expect(command('Por del equipo local Dorsal 7')).toBeNull();
  for (const text of [
    'no gol nuestro siete',
    'asistencia del nueve gol nuestro siete',
    'nuestro gol siete',
    'en el minuto seis gol nuestro siete',
  ])
    expect(command(text)).toBeNull();
});

test('yellow/red/blue cards and colourless cards have explicit outcomes', () => {
  expect(command('tarjeta amarilla nuestra 7')).toEqual({
    evento: 'amarilla',
    equipo: 'equipo1',
    dorsal: 7,
  });
  expect(command('tarjeta nuestra 7 roja')).toEqual({
    evento: 'descalificacion',
    equipo: 'equipo1',
    dorsal: 7,
  });
  expect(command('azul nuestra 7')).toEqual({
    evento: 'descalificacion',
    equipo: 'equipo1',
    dorsal: 7,
    azul: true,
  });
  expect(command('tarjeta nuestra 7')).toEqual({
    evento: 'desconocido',
    equipo: 'equipo1',
    dorsal: 7,
  });
  expect(command('amarilla nuestra 7 azul')).not.toHaveProperty('azul');
});

const examples: Record<
  Language,
  { events: string[]; own: string; card: string; colours: string[] }
> = {
  es: {
    events: [
      'gol',
      'parada',
      'fallo',
      'pérdida',
      'recuperación',
      'penalti',
      'exclusión',
      'amarilla',
      'descalificación',
      'pasivo',
      'pasos',
      'cambio',
    ],
    own: 'nuestro',
    card: 'tarjeta',
    colours: ['amarilla', 'roja', 'azul'],
  },
  en: {
    events: [
      'goal',
      'save',
      'miss',
      'turnover',
      'recovery',
      'penalty',
      'suspension',
      'yellow',
      'disqualification',
      'passive',
      'steps',
      'substitution',
    ],
    own: 'our',
    card: 'card',
    colours: ['yellow', 'red', 'blue'],
  },
  de: {
    events: [
      'Tor',
      'Parade',
      'Fehlwurf',
      'Ballverlust',
      'Ballgewinn',
      'Siebenmeter',
      'Zeitstrafe',
      'gelbe',
      'Disqualifikation',
      'passives Spiel',
      'Schritte',
      'Wechsel',
    ],
    own: 'unser',
    card: 'Karte',
    colours: ['gelbe', 'rote', 'blaue'],
  },
  fr: {
    events: [
      'but',
      'arrêt',
      'raté',
      'perte',
      'récupération',
      'penalty',
      'exclusion',
      'jaune',
      'disqualification',
      'passif',
      'marcher',
      'changement',
    ],
    own: 'notre',
    card: 'carton',
    colours: ['jaune', 'rouge', 'bleu'],
  },
  it: {
    events: [
      'gol',
      'parata',
      'sbagliato',
      'palla persa',
      'recupero',
      'rigore',
      'esclusione',
      'giallo',
      'squalifica',
      'passivo',
      'passi',
      'cambio',
    ],
    own: 'nostro',
    card: 'cartellino',
    colours: ['giallo', 'rosso', 'blu'],
  },
  nl: {
    events: [
      'doelpunt',
      'redding',
      'misser',
      'balverlies',
      'balwinst',
      'strafworp',
      'tijdstraf',
      'gele',
      'diskwalificatie',
      'passief',
      'loopfout',
      'wissel',
    ],
    own: 'ons',
    card: 'kaart',
    colours: ['gele', 'rode', 'blauwe'],
  },
  pl: {
    events: [
      'bramka',
      'obrona',
      'pudło',
      'strata',
      'przechwyt',
      'karny',
      'wykluczenie',
      'żółta',
      'dyskwalifikacja',
      'pasywna',
      'kroki',
      'zmiana',
    ],
    own: 'nasz',
    card: 'kartka',
    colours: ['żółta', 'czerwona', 'niebieska'],
  },
};
const events = [
  'gol',
  'parada',
  'fallo',
  'perdida',
  'recuperacion',
  'penalti_cometido',
  'exclusion',
  'amarilla',
  'descalificacion',
  'pasivo',
  'infraccion',
  'sustitucion',
];
for (const language of Object.keys(examples) as Language[]) {
  test(`${language}: all event commands, cards, and numeric/spoken shirts 0–99`, () => {
    const example = examples[language];
    example.events.forEach((word, index) =>
      expect(parse(`${word} ${example.own} 21 9`, language, teams).proposal, word).toMatchObject({
        evento: events[index],
        equipo: 'equipo1',
        ...(index === 9 ? {} : { dorsal: 21 }),
      }),
    );
    example.colours.forEach((colour, index) =>
      expect(
        parse(`${example.card} ${colour} ${example.own} 7`, language, teams).proposal,
      ).toMatchObject({
        evento: index ? 'descalificacion' : 'amarilla',
        dorsal: 7,
        ...(index === 2 ? { azul: true } : {}),
      }),
    );
    for (let number = 0; number <= 99; number++) {
      expect(
        parse(`${example.events[0]} ${example.own} ${number} 9`, language, teams).proposal,
      ).toMatchObject({ dorsal: number, dorsal_relacionado: 9 });
      expect(
        parse(
          `${example.events[0]} ${example.own} ${spokenNumber(number, language)}`,
          language,
          teams,
        ).proposal,
      ).toMatchObject({ dorsal: number });
    }
  });
}
