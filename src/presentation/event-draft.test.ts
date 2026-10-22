import { expect, test } from 'vitest';
import { eventDraftIssues } from './event-draft';
import type { EventDraft } from '../data/database';
import { reportFixture } from '../../tests/fixtures/report';

test('preview uses domain issues without writing or requiring a roster for new shirts', () => {
  const { matches, players } = reportFixture();
  const original = structuredClone(players);
  const draft: EventDraft = {
    matchId: matches[0].id,
    type: 'goal',
    teamId: 'a',
    primaryDorsal: '23',
    relatedDorsal: '',
    period: 1,
    minute: 0,
    metadata: {},
    note: '',
    rawText: '',
  };
  expect(eventDraftIssues(draft, matches[0], players)).toEqual([]);
  expect(eventDraftIssues({ ...draft, type: null, teamId: null }, matches[0], players)).toEqual([
    'Selecciona un evento',
    'Selecciona un equipo',
  ]);
  expect(eventDraftIssues({ ...draft, type: 'infraction' }, matches[0], players)).toEqual([
    'Selecciona el tipo de infracción',
  ]);
  expect(
    eventDraftIssues(
      { ...draft, type: 'substitution', primaryDorsal: '23', relatedDorsal: '23' },
      matches[0],
      players,
    ),
  ).toEqual(['El jugador que sale y el que entra deben ser distintos.']);
  expect(
    eventDraftIssues(
      { ...draft, type: 'save', primaryDorsal: '23', relatedDorsal: '23' },
      matches[0],
      players,
    ),
  ).toEqual([]);
  expect(players).toEqual(original);
});
