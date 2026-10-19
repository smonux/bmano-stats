import { expect, test } from 'vitest';
import {
  captureContext,
  resolveTeam,
  resolveDorsal,
  toVoiceDraft,
  type CaptureContext,
} from './interpretation';
import type { Snapshot, Match } from '../domain/model';
import { interpretCommand } from './commands';
const base = { createdAt: 1, updatedAt: 1, deletedAt: null };
const match: Match = {
  ...base,
  id: 'm',
  localTeamId: 'a',
  visitorTeamId: 'b',
  date: '2026-10-16',
  status: 'active',
  clock: { period: 2, elapsedMs: 180000, startedAt: null },
};
const data: Snapshot = {
  teams: [
    { ...base, id: 'a', name: 'Águilas', nameKey: 'águilas' },
    { ...base, id: 'b', name: 'Leones', nameKey: 'leones' },
  ],
  matches: [match],
  events: [],
  players: [
    { ...base, id: 'p', teamId: 'a', name: 'Ana', dorsal: 9, isUnknown: false },
    { ...base, id: 'q', teamId: 'b', name: 'Ana', dorsal: 12, isUnknown: false },
  ],
};
const context: CaptureContext = captureContext(match, data);
const proposal = {
  evento: 'gol',
  equipo: 'nuestro',
  nombre: 'Ana',
  nombre_relacionado: '',
  penalti: false,
  azul: false,
  infraccion: '',
};
test('speaker perspective always assigns our team to team 1, independent of venue', () => {
  const ours = toVoiceDraft('gol nuestro, Ana', proposal, context);
  expect(ours.draft).toMatchObject({
    type: 'goal',
    teamId: 'a',
    primaryDorsal: '9',
    rawText: 'gol nuestro, Ana',
    period: 2,
    minute: 3,
  });
  for (const word of [
    'nuestro',
    'nuestra',
    'nuestros',
    'nuestras',
    'nosotros',
    'nosotras',
    'mi equipo',
    'equipo1',
  ]) {
    expect(resolveTeam(word, context)).toBe('a');
  }
  for (const word of [
    'ellos',
    'ellas',
    'rival',
    'contrario',
    'suyo',
    'suya',
    'suyos',
    'suyas',
    'su equipo',
    'equipo2',
  ]) {
    expect(resolveTeam(word, context)).toBe('b');
  }
  for (const word of ['local', 'visitante', '', 'desconocido']) {
    expect(resolveTeam(word, context)).toBeNull();
  }
  expect(
    toVoiceDraft('gol nuestro, Marta', { ...proposal, nombre: 'Marta' }, context).draft
      .primaryDorsal,
  ).toBe('');
  const reversed = { ...context, match: { ...match, localTeamId: 'b', visitorTeamId: 'a' } };
  expect(toVoiceDraft('gol nuestro, Ana', proposal, reversed).draft).toMatchObject({
    teamId: 'b',
    primaryDorsal: '12',
  });
});
test('names are resolved within the correct team; dorsal 0 is valid; duplicate names are ambiguous', () => {
  expect(resolveDorsal('ana', 'b', data)).toBe('12');
  expect(resolveDorsal('dorsal 0', 'a', data)).toBe('0');
  expect(resolveDorsal('100', 'a', data)).toBe('');
  expect(resolveDorsal('An', 'a', data)).toBe('');
  const duplicate = {
    ...data,
    players: [...data.players, { ...data.players[0], id: 'p2', dorsal: 10 }],
  };
  expect(resolveDorsal('Ana', 'a', duplicate)).toBe('');
});
test('related players follow event roles; incompatible fields are dropped', () => {
  const goal = toVoiceDraft(
    'gol de Águilas',
    { ...proposal, equipo: 'Águilas', nombre_relacionado: 'Ana', azul: true },
    context,
  ).draft;
  expect(goal.relatedDorsal).toBe('9');
  expect(goal.metadata).toEqual({});
  const save = toVoiceDraft(
    'parada nuestra',
    { ...proposal, evento: 'parada', equipo: 'nuestro', nombre_relacionado: 'Ana', penalti: true },
    context,
  ).draft;
  expect(save.relatedDorsal).toBe('12');
  expect(save.metadata).toEqual({ penalty: true });
  const passive = toVoiceDraft(
    'pasivo rival',
    { ...proposal, evento: 'pasivo', equipo: 'rival', penalti: true },
    context,
  ).draft;
  expect(passive).toMatchObject({
    teamId: 'b',
    primaryDorsal: '',
    relatedDorsal: '',
    metadata: {},
  });
});
test('invalid or withheld interpretation preserves a pending draft', () => {
  for (const result of [
    null,
    {},
    { ...proposal, evento: 'inventado' },
    { ...proposal, equipo: 5 },
  ]) {
    expect(toVoiceDraft('literal', result, context).draft).toMatchObject({
      type: null,
      teamId: null,
      rawText: 'literal',
    });
  }
});

test('a colourless card reaches the editor as yellow with its recognized shirt and team', () => {
  const text = 'tarjeta nuestra siete';
  const result = interpretCommand(text, 'es', ['Águilas', 'Leones']);
  expect(toVoiceDraft(text, result.proposal, context).draft).toMatchObject({
    type: 'yellow',
    teamId: 'a',
    primaryDorsal: '7',
    rawText: 'tarjeta nuestra siete',
    metadata: {},
  });
});

test('recorder perspective resolves across all seven Whistle languages without assuming venue', () => {
  for (const word of [
    'our',
    'us',
    'unser',
    'wir',
    'notre',
    'nous',
    'nostro',
    'noi',
    'ons',
    'wij',
    'nasz',
    'my',
  ]) {
    expect(resolveTeam(word, context)).toBe('a');
  }
  for (const word of [
    'their',
    'opponent',
    'Gegner',
    'sie',
    'eux',
    'leur',
    'loro',
    'avversario',
    'hun',
    'tegenstander',
    'oni',
    'rywal',
  ]) {
    expect(resolveTeam(word, context)).toBe('b');
  }
  for (const word of ['home', 'away', 'Heim', 'domicile', 'casa', 'thuis', 'gospodarz']) {
    expect(resolveTeam(word, context)).toBeNull();
  }
  const polish = {
    ...data,
    players: [...data.players, { ...data.players[0], id: 'pl', name: 'Łukasz', dorsal: 4 }],
  };
  expect(resolveDorsal('łukasz', 'a', polish)).toBe('4');
});

test('substitution incoming player names resolve in the same team as the outgoing player', () => {
  const result = toVoiceDraft(
    'Cambio nuestro, sale el 6 y entra Ana',
    { evento: 'sustitucion', equipo: 'equipo1', dorsal: 6, nombre_relacionado: 'Ana' },
    context,
  );
  expect(result.draft).toMatchObject({
    type: 'substitution',
    teamId: 'a',
    primaryDorsal: '6',
    relatedDorsal: '9',
    metadata: {},
  });
});
