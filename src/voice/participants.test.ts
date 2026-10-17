import { expect, test } from 'vitest';
import { interpretDeterministically as parse } from './deterministic';
import { teams } from './fixtures/utterances';

test('role-specific extraction, primary team and literal names, without roster inference', () => {
  const cases: [string, object][] = [
    [
      'Parada rival dorsal uno, tiro de nuestro dorsal nueve',
      { evento: 'parada', equipo: 'equipo2', dorsal: 1, dorsal_relacionado: 9 },
    ],
    [
      'Gol nuestro dorsal siete asistencia de Ana María',
      { evento: 'gol', equipo: 'equipo1', dorsal: 7, nombre_relacionado: 'Ana María' },
    ],
    ['Gol de Ana', { evento: 'gol', equipo: 'desconocido', nombre: 'Ana' }],
    [
      'Recuperación nuestra dorsal ocho, pierde el dorsal once rival',
      { evento: 'recuperacion', equipo: 'equipo1', dorsal: 8, dorsal_relacionado: 11 },
    ],
    [
      'Penalti cometido por nuestro seis sobre el nueve rival',
      { evento: 'penalti_cometido', equipo: 'equipo1', dorsal: 6, dorsal_relacionado: 9 },
    ],
    [
      'Roja nuestra dorsal dos, provocada por Ana rival',
      { evento: 'descalificacion', equipo: 'equipo1', dorsal: 2, nombre_relacionado: 'Ana' },
    ],
    ['Gol de La Jota', { evento: 'gol', equipo: 'equipo1' }],
    ['Gol de La Jota', { evento: 'gol', equipo: 'equipo2' }],
  ];
  cases.forEach(([text, expected], index) =>
    expect(
      parse(text, 'es', index === cases.length - 1 ? [...teams].reverse() : teams).proposal,
      text,
    ).toMatchObject(expected),
  );
  const roster = [
    { name: 'Ana María', team: 'equipo1' as const },
    { name: 'Ana María', team: 'equipo2' as const },
  ];
  expect(parse('gol de ana maria', 'es', teams, roster).proposal).toEqual({
    evento: 'gol',
    equipo: 'desconocido',
    nombre: 'ana maria',
  });
});

test('keyword approximation is a bounded fallback and never fuzzes known player names', () => {
  for (const [text, evento] of [
    ['Exclucion nuestra dorsal seis', 'exclusion'],
    ['Recupera nuestra dorsal seis', 'recuperacion'],
    ['Penal nuestro dorsal seis', 'penalti_cometido'],
    ['Asistencia nuestra de Ana', 'gol'],
  ]) {
    expect(parse(text, 'es', teams).proposal, text).toMatchObject({ evento, equipo: 'equipo1' });
  }
  const typo = parse('Exclucion nuestra dorsal seis', 'es', teams);
  expect(typo.eventMatch).toBe('approximate');
  expect(typo.warnings.join(' ')).toContain('aproximación');
  expect(parse('Asistencia nuestra de Ana', 'es', teams).proposal).toEqual({
    evento: 'gol',
    equipo: 'equipo1',
    nombre_relacionado: 'Ana',
  });
  expect(
    parse('Exclucion', 'es', teams, [{ name: 'Exclucion', team: 'equipo1' }]).proposal,
  ).toBeNull();
});

test('known player names are not event cues or shirt numbers', () => {
  const players = [
    { name: 'Marco', team: 'equipo1' as const },
    { name: 'Siete', team: 'equipo1' as const },
  ];
  expect(parse('Amarilla nuestra a Marco', 'es', teams, players).proposal).toEqual({
    evento: 'amarilla',
    equipo: 'equipo1',
    nombre: 'Marco',
  });
  expect(parse('Gol nuestro de Siete', 'es', teams, players).proposal).toEqual({
    evento: 'gol',
    equipo: 'equipo1',
    nombre: 'Siete',
  });
});
