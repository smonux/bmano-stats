import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, LoaderCircle } from 'lucide-react';
import { tr, languages, useLanguage } from '../i18n';
import { LanguagePicker } from '../components/LanguagePicker';
import type { EventDraft } from '../data/database';
import { EventEditor } from '../components/EventEditor';
import { VoicePreparation } from '../components/VoicePreparation';
import { PushToTalkButton } from '../components/voice/PushToTalkButton';
import { useVoiceCapture } from '../components/voice/useVoiceCapture';
import { PracticeGrammar } from '../components/voice-practice/PracticeGrammar';
import { PracticeResult } from '../components/voice-practice/PracticeResult';
import {
  markVoicePracticeSeen,
  voicePracticeReturn,
} from '../components/voice-practice/VoicePracticeEntry';
import { navigate, ErrorMessage } from '../components/ui';
import { practiceContext, emptyPracticeDraft } from '../voice/practice/context';
import { practiceChallenges, practicePhrases } from '../voice/practice/challenges';
import { evaluatePractice } from '../voice/practice/evaluate';
import { practiceNames } from '../voice/practice/names';
import { useVoiceSetup } from '../voice/setup';

export function VoicePractice({
  route,
  live = false,
  onboarding,
}: {
  route: string;
  live?: boolean;
  onboarding?: { finish: () => void };
}) {
  const interfaceLanguage = useLanguage();
  const setup = useVoiceSetup();
  const spokenLanguage = setup.languageChosen ? setup.language : interfaceLanguage;
  const data = useMemo(() => practiceContext(spokenLanguage), [interfaceLanguage, spokenLanguage]);
  const [screen, setScreen] = useState<'intro' | 'challenge' | 'finish'>('intro');
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [assisted, setAssisted] = useState(false);
  const [outcomes, setOutcomes] = useState<boolean[]>([]);
  const [editing, setEditing] = useState(false);
  const heading = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const capture = useVoiceCapture(data.matches[0], data);
  const challenge = practiceChallenges[index];
  const evaluation = draft ? evaluatePractice(draft, challenge, data, assisted) : null;
  const busy = ['permission', 'recording', 'transcribing', 'interpreting'].includes(capture.phase);
  useEffect(() => {
    heading.current?.querySelector<HTMLHeadingElement>('h1')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [screen, index]);
  useEffect(() => {
    if (!capture.result) return;
    setDraft(capture.result.draft);
    setAssisted(false);
  }, [capture.result]);
  useEffect(() => {
    if (draft && screen === 'challenge' && !editing) {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [draft, screen]);
  const exit = () => {
    markVoicePracticeSeen();
    capture.cancel();
    onboarding?.finish();
    navigate(voicePracticeReturn(route));
    requestAnimationFrame(() =>
      (
        document.querySelector<HTMLElement>('[data-voice-practice-entry]') ??
        document.querySelector<HTMLElement>('.menu-button')
      )?.focus(),
    );
  };
  const next = () => {
    if (evaluation?.state !== 'green' || busy) return;
    setOutcomes((previous) => {
      const updated = [...previous];
      updated[index] = assisted;
      return updated;
    });
    capture.cancel();
    if (index === practiceChallenges.length - 1) {
      markVoicePracticeSeen(true);
      setScreen('finish');
    } else {
      setIndex(index + 1);
      setDraft(null);
      setAssisted(false);
    }
  };
  return (
    <section className="voice-practice" aria-label={tr('Entrenamiento de voz')}>
      <header className="practice-exit">
        <button onClick={exit}>{tr('Salir de la práctica')}</button>
      </header>
      <div className="practice-content">
        <div ref={heading} className="practice-heading">
          {screen === 'intro' ? (
            <>
              {onboarding && <LanguagePicker />}
              <PracticeGrammar language={spokenLanguage} />
            </>
          ) : screen === 'finish' ? (
            <>
              <CircleCheck className="practice-finish-icon" size={64} aria-hidden="true" />
              <p className="eyebrow">{tr('PRÁCTICA COMPLETADA')}</p>
              <h1 tabIndex={-1}>{tr('Ya tienes la fórmula.')}</h1>
              <p>
                {tr('4 de 4 retos completados · {count} con ayuda.', {
                  count: outcomes.filter(Boolean).length,
                })}
              </p>
              <p>
                {tr(
                  'Evento y equipo. Añade jugadores cuando puedas y completa lo que falte después.',
                )}
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">{tr('Jugada {number} de 4', { number: index + 1 })}</p>
              <ol className="practice-progress" aria-hidden="true">
                {practiceChallenges.map((_, step) => (
                  <li
                    key={step}
                    className={step < index ? 'done' : step === index ? 'current' : ''}
                  />
                ))}
              </ol>
              <h1 tabIndex={-1}>{tr(challenge.title)}</h1>
              <p>{tr(challenge.tip, practiceNames[spokenLanguage])}</p>
              <div className="practice-sentence">
                <small>
                  {tr('Lee esta frase')} · {languages[spokenLanguage]}
                </small>
                <blockquote lang={spokenLanguage}>
                  «{practicePhrases[spokenLanguage][index]}»
                </blockquote>
              </div>
              <p>{tr(challenge.task, practiceNames[spokenLanguage])}</p>
            </>
          )}
        </div>
        {screen === 'challenge' && (
          <>
            <PushToTalkButton
              capture={capture}
              started={() => {
                setDraft(null);
                setAssisted(false);
              }}
            />
            {capture.phase === 'recording' && (
              <p role="status">{tr('Micrófono activo. Máximo veinte segundos.')}</p>
            )}
            {['transcribing', 'interpreting'].includes(capture.phase) && (
              <p role="status">
                <LoaderCircle className="spin" size={18} aria-hidden="true" /> {capture.status}
              </p>
            )}
            {(capture.error || capture.problem) && (
              <div className="practice-voice-error">
                <strong>{tr('Problema con la voz')}</strong>
                <ErrorMessage text={capture.problem || capture.error} />
              </div>
            )}
            {!capture.ready && (
              <p role="status">{tr('Puedes preparar la voz o completar el reto manualmente.')}</p>
            )}
            <div className="practice-actions">
              <button disabled={busy} onClick={() => setEditing(true)}>
                {tr(draft ? 'Completar o corregir' : 'Completar manualmente')}
              </button>
              {(draft || capture.error) && (
                <button
                  disabled={busy}
                  onClick={() => {
                    capture.cancel();
                    setDraft(null);
                    setAssisted(false);
                  }}
                >
                  {tr('Repetir jugada')}
                </button>
              )}
              {busy && (
                <button onClick={() => capture.cancel()}>{tr('Cancelar reconocimiento')}</button>
              )}
            </div>
            {evaluation && draft && (
              <PracticeResult
                draft={draft}
                data={data}
                evaluation={evaluation}
                assisted={assisted}
                resultRef={resultRef}
              />
            )}
            <details className="practice-preparation" open={!capture.ready || undefined}>
              <summary>{tr('Preparar o cambiar idioma de voz')}</summary>
              {live && (
                <p>
                  {tr(
                    'Hay un partido en curso. Puedes usar la voz local preparada o practicar manualmente.',
                  )}
                </p>
              )}
              <VoicePreparation live={live} practiceEntry="none" />
            </details>
          </>
        )}
      </div>
      <footer className="practice-footer">
        {screen === 'intro' ? (
          <button
            className="primary full"
            onClick={() => {
              markVoicePracticeSeen();
              setStarted(true);
              setScreen('challenge');
            }}
          >
            {tr(started ? 'Volver a mi jugada' : 'Entendido · Vamos a practicar')}
          </button>
        ) : screen === 'finish' ? (
          <>
            <button className="primary full" onClick={exit}>
              {tr('Volver a la aplicación')}
            </button>
            <button
              className="full"
              onClick={() => {
                capture.cancel();
                setScreen('intro');
                setStarted(false);
                setIndex(0);
                setOutcomes([]);
                setDraft(null);
                setAssisted(false);
              }}
            >
              {tr('Volver a practicar')}
            </button>
          </>
        ) : (
          <>
            <button
              className="primary full"
              disabled={evaluation?.state !== 'green' || busy}
              onClick={next}
            >
              {tr(index === 3 ? 'Terminar entrenamiento' : 'Siguiente jugada')}
            </button>
            <button
              className="full"
              onClick={() => {
                capture.cancel();
                setScreen('intro');
              }}
            >
              {tr('Recordar la gramática')}
            </button>
          </>
        )}
        <p className="caption">{tr('4 jugadas · equipos ficticios · no afecta a tus partidos')}</p>
      </footer>
      {editing && (
        <EventEditor
          data={data}
          match={data.matches[0]}
          initialDraft={draft ?? emptyPracticeDraft()}
          practice={{
            check: (corrected) => {
              const changed = !draft || JSON.stringify(corrected) !== JSON.stringify(draft);
              setDraft(corrected);
              setAssisted(assisted || changed || challenge.editRequired === true);
            },
          }}
          close={() => setEditing(false)}
        />
      )}
    </section>
  );
}
