import { LoaderCircle } from 'lucide-react';
import type { GameEvent, Match, Snapshot } from '../domain/schema';
import { tr } from '../i18n';
import { EventEditor } from './EventEditor';
import { ErrorMessage } from './ui';
import { useVoiceCapture } from './voice/useVoiceCapture';
import { useEffect, useRef, useState } from 'react';
import { VoiceReview } from './voice/VoiceReview';
import { PushToTalkButton } from './voice/PushToTalkButton';

export function VoiceCapture({
  match,
  data,
  allowReview,
  saved,
  started,
}: {
  match: Match;
  data: Snapshot;
  allowReview: boolean;
  saved?: (event: GameEvent, pending: boolean, primaryDorsal?: string) => void;
  started?: () => void;
}) {
  const capture = useVoiceCapture(match, data);
  const { setup, phase, status, error, result, closeReview, ready, problem } = capture;
  const [editing, setEditing] = useState(false);
  const talkButton = useRef<HTMLButtonElement>(null);
  const hadReview = useRef(false);
  useEffect(() => {
    if (result) hadReview.current = true;
    else if (hadReview.current) {
      hadReview.current = false;
      setEditing(false);
      talkButton.current?.focus({ preventScroll: true });
    }
  }, [result]);
  return (
    <>
      <PushToTalkButton capture={capture} buttonRef={talkButton} started={started} />
      {setup.phase === 'loading' && (
        <p className="capture-status" role="status">
          {tr('Preparando reconocimiento…')} {setup.progress}
        </p>
      )}
      {!ready && setup.phase !== 'loading' && (
        <div className="capture-status" role="alert">
          {tr('Voz no preparada.')} <a href="#/ajustes">{tr('Preparar voz')}</a>
        </div>
      )}
      {(problem || error || setup.error) && (
        <div className="capture-status">
          <ErrorMessage text={problem || error || setup.error} />
        </div>
      )}
      {['transcribing', 'interpreting'].includes(phase) && (
        <p className="capture-status" role="status">
          <LoaderCircle className="spin" size={16} aria-hidden="true" /> {status}{' '}
          {tr('Puedes seguir usando la entrada manual.')}
        </p>
      )}
      {phase === 'review' &&
        result &&
        (allowReview ? (
          editing ? (
            <EventEditor
              data={data}
              match={match}
              saved={saved}
              initialDraft={result.draft}
              voiceTimings={result.timings}
              close={closeReview}
            />
          ) : (
            <VoiceReview
              saved={saved}
              result={result}
              data={data}
              match={match}
              edit={() => setEditing(true)}
              close={closeReview}
            />
          )
        ) : (
          <p className="capture-status" role="status">
            {tr('Propuesta lista. Termina la edición manual para revisarla.')}
          </p>
        ))}
      {phase === 'recording' && (
        <span className="sr-only" role="status">
          {tr('Micrófono activo. Máximo veinte segundos.')}
        </span>
      )}
    </>
  );
}
