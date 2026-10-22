import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, repo } from '../../src/data/database';
import { VoiceEngine } from '../../src/voice/engine';
import { captureContext, toVoiceDraft } from '../../src/voice/interpretation';
import type { RecognizedEvent } from '../../src/voice/recognition';
import { VoiceReview } from '../../src/components/voice/VoiceReview';
import { EventEditor } from '../../src/components/EventEditor';
import { matchScore } from '../../src/presentation/matches';
import { reportFixture } from '../fixtures/report';
import { setLanguage } from '../../src/i18n';
import '../../src/style.css';

setLanguage('es');
const parameters = new URLSearchParams(location.search);
const text = parameters.get('text') ?? 'gol nuestro 7 1 penalti';
if (!(await db.matches.count())) {
  const fixture = reportFixture();
  fixture.events = [];
  if (parameters.has('long'))
    fixture.teams[0].name = 'Club Balonmano La Jota de Zaragoza con nombre de equipo muy largo';
  if (parameters.has('long')) {
    const { nameKey } = await import('../../src/domain/identity');
    fixture.teams[0].nameKey = nameKey(fixture.teams[0].name);
    fixture.players.find((player) => player.id === 'a7')!.name =
      'Ana con un nombre de jugadora muy largo para revisar el ajuste';
  }
  await repo.importBackup(fixture);
}
function Fixture() {
  const data = useLiveQuery(() => db.snapshot(), []);
  const [result, setResult] = useState<RecognizedEvent | null>(null);
  const [editing, setEditing] = useState(false);
  if (!data) return <p>Cargando</p>;
  const match = data.matches[0];
  const close = () => {
    setResult(null);
    setEditing(false);
  };
  const show = async () => {
    const response = await new VoiceEngine('es').interpret(
      text,
      data.teams.map((team) => team.name),
    );
    const result = toVoiceDraft(text, response.proposal, captureContext(match, data));
    if (parameters.has('invalid')) result.draft.period = 99;
    setResult({
      ...result,
      defaultTeamApplied: response.defaultTeamApplied,
      timings: { whistleMs: 1000, rulesMs: 1, needleMs: 0 },
    });
  };
  return (
    <main className="app-main">
      <button onClick={() => void show()}>Mostrar propuesta</button>
      <p data-testid="score">{matchScore(data, match).join(':')}</p>
      <pre data-testid="events">{JSON.stringify(data.events)}</pre>
      {result &&
        (editing ? (
          <EventEditor
            data={data}
            match={match}
            initialDraft={result.draft}
            voiceTimings={result.timings}
            close={close}
          />
        ) : (
          <VoiceReview
            result={result}
            data={data}
            match={match}
            close={close}
            edit={() => setEditing(true)}
          />
        ))}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
