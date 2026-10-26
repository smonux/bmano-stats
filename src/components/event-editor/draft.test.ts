import { expect, test } from 'vitest';
import { createEditorDraft } from './draft';
import { reportFixture } from '../../../tests/fixtures/report';
test('only a new manual draft chooses team 1; pending and opponent edits retain attribution', () => {
  const data = reportFixture(),
    match = data.matches[0];
  expect(createEditorDraft(data, match)).toMatchObject({ type: null, teamId: match.localTeamId });
  const pending = data.events.find((event) => event.type === null)!;
  expect(createEditorDraft(data, match, pending)).toMatchObject({
    type: null,
    teamId: null,
    id: pending.id,
  });
  const rival = data.events.find((event) => event.teamId === match.visitorTeamId)!;
  expect(createEditorDraft(data, match, rival)).toMatchObject({
    type: rival.type,
    teamId: match.visitorTeamId,
    id: rival.id,
  });
});
