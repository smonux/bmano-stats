import { useRef } from 'react';
import type { GameEvent, Match, Snapshot } from '../../domain/schema';
import { definitions } from '../../domain/event-definitions';
import { relatedTeam } from '../../domain/events';
import { repo } from '../../data/database';
import { eventDraftIssues } from '../../presentation/event-draft';
import { teamName } from '../../presentation/matches';
import { tr } from '../../i18n';
import type { RecognizedEvent } from '../../voice/recognition';
import { Modal, ErrorMessage, useAction } from '../ui';

export function VoiceReview({
  result,
  data,
  match,
  edit,
  close,
  saved,
}: {
  result: RecognizedEvent;
  data: Snapshot;
  match: Match;
  edit: () => void;
  close: () => void;
  saved?: (event: GameEvent, pending: boolean) => void;
}) {
  const { draft } = result;
  const action = useAction();
  const interpretation = useRef<HTMLDivElement>(null);
  const saveReview = () => {
    void action.run(async () => {
      const event = await repo.saveEvent(draft);
      saved?.(event, issues.length > 0);
      close();
    });
  };

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
      initialFocus={interpretation}
    >
      <div
        ref={interpretation}
        className="voice-review-copy"
        role="region"
        aria-label={tr('Interpretación de voz')}
        tabIndex={-1}
      >
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
                {result.defaultTeamApplied && (
                  <strong className="inferred-value">{tr('Equipo por defecto')}</strong>
                )}
              </dd>
            </>
          )}
          {definition && draft.type !== 'passive' && draft.type !== 'note' && (
            <>
              <dt>{tr(definition.principal)}</dt>
              <dd>
                {player(draft.teamId, draft.primaryDorsal)}
                {result.goalkeeperDefaultApplied && (
                  <strong className="inferred-value">{tr('Último portero utilizado')}</strong>
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
        <details className="review-transcript">
          <summary>{tr('Transcripción original')}</summary>
          <p className="voice-transcript">
            <span>{draft.rawText}</span>
          </p>
        </details>
      </div>
      <footer className="voice-review-footer">
        <ErrorMessage text={action.error} />
        <div className="actions">
          <button type="button" disabled={action.busy} onClick={edit}>
            {tr('Editar')}
          </button>
          <button className="primary" type="button" disabled={action.busy} onClick={saveReview}>
            {tr(
              action.busy ? 'Guardando…' : issues.length ? 'Guardar pendiente' : 'Guardar evento',
            )}
          </button>
        </div>
        <button type="button" className="text-button" disabled={action.busy} onClick={close}>
          {tr('Descartar')}
        </button>
      </footer>
    </Modal>
  );
}
