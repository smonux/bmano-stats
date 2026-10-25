import { LoaderCircle, Mic } from 'lucide-react';
import type { GameEvent, Match, Snapshot } from '../domain/schema';
import { tr } from '../i18n';
import { EventEditor } from './EventEditor';
import { ErrorMessage } from './ui';
import { useVoiceCapture } from './voice/useVoiceCapture';
import { useEffect, useRef, useState } from 'react';
import { VoiceReview } from './voice/VoiceReview';
import type { EventUndo } from '../data/repository/event-undo';

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
  saved?: (event: GameEvent, pending: boolean, undo?: EventUndo, primaryDorsal?: string) => void;
  started?: () => void;
}) {
  const {
    setup,
    phase,
    status,
    error,
    result,
    seconds,
    start,
    release,
    closeReview,
    ready,
    problem,
  } = useVoiceCapture(match, data);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) release();
    };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [release]);
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
      <button
        ref={talkButton}
        className={`hold-to-talk ${phase === 'recording' ? 'recording' : ''}`}
        aria-label={
          phase === 'recording' ? tr('Grabando · {seconds} s', { seconds }) : tr('Voz (mantener)')
        }
        disabled={
          !ready || Boolean(problem) || ['transcribing', 'interpreting', 'review'].includes(phase)
        }
        aria-disabled={phase === 'permission'}
        onPointerDown={(e) => {
          if (e.button !== 0 || phase !== 'ready') {
            return;
          }
          e.preventDefault();
          started?.();
          e.currentTarget.setPointerCapture(e.pointerId);
          void start();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            if (phase === 'ready') started?.();
            void start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            release();
          }
        }}
        onBlur={release}
      >
        <Mic size={20} />
        {phase === 'recording'
          ? tr('Grabando · {seconds} s', { seconds })
          : phase === 'permission'
            ? tr('Solicitando permiso…')
            : tr('Voz (mantener)')}
      </button>
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
