import { useEffect, useRef, useState } from 'react';
import type { Match, Snapshot } from '../../domain/schema';
import { definitions } from '../../domain/event-definitions';
import { relatedTeam } from '../../domain/events';
import { repo } from '../../data/database';
import { eventDraftIssues } from '../../presentation/event-draft';
import { teamName } from '../../presentation/matches';
import { tr } from '../../i18n';
import type { RecognizedEvent } from '../../voice/recognition';
import { Modal, ErrorMessage, useAction } from '../ui';
import { startReviewCountdown } from './review-countdown';

export function VoiceReview({
  result,
  data,
  match,
  edit,
  close,
}: {
  result: RecognizedEvent;
  data: Snapshot;
  match: Match;
  edit: () => void;
  close: () => void;
}) {
  const { draft } = result;
  const action = useAction();
  const continueButton = useRef<HTMLButtonElement>(null);
  const [seconds, setSeconds] = useState<number | null>(5);
  const cancelCountdown = useRef(() => {});
  const stop = () => {
    cancelCountdown.current();
    setSeconds(null);
  };
  const continueReview = () => {
    stop();
    void action.run(async () => {
      await repo.saveEvent(draft);
      close();
    });
  };
  const continueRef = useRef(continueReview);
  continueRef.current = continueReview;
  useEffect(() => {
    if (document.hidden) {
      setSeconds(null);
      return;
    }
    const cancel = startReviewCountdown(setSeconds, () => continueRef.current());
    cancelCountdown.current = cancel;
    const hide = () => {
      if (document.hidden) {
        cancel();
        setSeconds(null);
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancel();
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  const definition = draft.type ? definitions[draft.type] : undefined;
  const player = (teamId: string | null, dorsal: string) => {
    if (dorsal === '') return tr('Desconocido');
    const known = data.players.find(
      (player) => !player.deletedAt && player.teamId === teamId && player.dorsal === Number(dorsal),
    );
    return `#${dorsal}${known?.name ? ` · ${known.name}` : ''}`;
  };
  const issues = eventDraftIssues(draft, match, data.players);
  const teamNumber = draft.teamId === match.localTeamId ? 1 : 2;
  return (
    <Modal
      title={tr('Confirmar jugada')}
      className="voice-review"
      close={() => !action.busy && close()}
      onInteraction={stop}
      initialFocus={continueButton}
    >
      <div className="voice-review-copy">
        <p className="voice-transcript">
          <strong>{tr('Transcripción original')}</strong>
          <span>{draft.rawText}</span>
        </p>
        <dl className="voice-review-summary">
          <dt>{tr('Evento')}</dt>
          <dd>
            <strong>{tr(definition?.label ?? 'Evento sin indicar')}</strong>
          </dd>
          {draft.type === 'note' ? (
            <>
              <dt>{tr('Nota del partido')}</dt>
              <dd className="event-note">{draft.note || tr('Escribe el texto de la nota')}</dd>
            </>
          ) : (
            <>
              <dt>{tr('Equipo')}</dt>
              <dd>
                {draft.teamId
                  ? `${teamNumber} · ${teamName(data, draft.teamId)}`
                  : tr('Equipo pendiente')}
                {result.defaultTeamApplied && <small> · {tr('Equipo por defecto')}</small>}
              </dd>
            </>
          )}
          {definition && draft.type !== 'passive' && draft.type !== 'note' && (
            <>
              <dt>{tr(definition.principal)}</dt>
              <dd>
                {player(draft.teamId, draft.primaryDorsal)}
                {result.goalkeeperDefaultApplied && (
                  <small> · {tr('Último portero utilizado')}</small>
                )}
              </dd>
            </>
          )}
          {definition?.related && draft.type && (
            <>
              <dt>{tr(definition.related)}</dt>
              <dd>
                {player(
                  draft.teamId ? relatedTeam(match, draft.type, draft.teamId) : null,
                  draft.relatedDorsal,
                )}
              </dd>
            </>
          )}
          {definition?.penalty && (
            <>
              <dt>{tr('De penalti')}</dt>
              <dd>{tr(draft.metadata.penalty ? 'Sí' : 'No')}</dd>
            </>
          )}
          {draft.type === 'disqualification' && (
            <>
              <dt>{tr('Tarjeta azul')}</dt>
              <dd>{tr(draft.metadata.blue ? 'Sí' : 'No')}</dd>
            </>
          )}
          {draft.type === 'infraction' && (
            <>
              <dt>{tr('Tipo de infracción')}</dt>
              <dd>{tr(draft.metadata.infraction ?? 'Sin indicar')}</dd>
            </>
          )}
          <dt>
            {tr('Tiempo')} / {tr('Minuto')}
          </dt>
          <dd>
            {draft.period} / {draft.minute}′
          </dd>
        </dl>
        {issues.length > 0 && (
          <p className="pending-hint">
            {tr('Se guardará pendiente; no contará en las estadísticas.')}{' '}
            {issues.map((issue) => tr(issue)).join('. ')}.
          </p>
        )}
      </div>
      <footer className="voice-review-footer">
        <p className="caption" role="status">
          {tr(
            seconds === null
              ? 'Guardado automático detenido.'
              : 'Se guardará en cinco segundos. Toca o usa el teclado para detener la cuenta.',
          )}
        </p>
        <ErrorMessage text={action.error} />
        <div className="actions">
          <button
            ref={continueButton}
            className="primary"
            type="button"
            disabled={action.busy}
            onClick={continueReview}
          >
            {action.busy ? (
              tr('Guardando…')
            ) : (
              <>
                {tr('Continuar')}
                <span aria-hidden="true">{seconds === null ? '' : ` (${seconds} s)`}</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={action.busy}
            onClick={() => {
              stop();
              edit();
            }}
          >
            {tr('Editar')}
          </button>
        </div>
        <button type="button" className="text-button" disabled={action.busy} onClick={close}>
          {tr('Descartar')}
        </button>
      </footer>
    </Modal>
  );
}
