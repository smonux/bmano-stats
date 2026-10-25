import { createEditorDraft } from './event-editor/draft';
import { eventDraftIssues } from '../presentation/event-draft';
import { lastGoalkeeper } from '../domain/goalkeepers';
import { WheelPicker } from './WheelPicker';
import { ChoiceGroup } from './event-editor/ChoiceGroup';
import { draftSummary } from '../presentation/event-summary';
import { EventIcon } from './EventIcon';
import { ParticipantPicker } from './event-editor/ParticipantPicker';
import { EventMetadata } from './event-editor/EventMetadata';
import { tr } from '../i18n';
import { useId, useRef, useState } from 'react';
import {
  definitions,
  eventTypes,
  relatedTeam,
  type EventType,
  type GameEvent,
  type Match,
  type Snapshot,
} from '../domain/model';
import { repo, type EventDraft } from '../data/database';
import { ErrorMessage, Modal, NumberWheel, useAction } from './ui';
export function EventEditor({
  data,
  match,
  event,
  initialDraft,
  voiceTimings,
  close,
}: {
  data: Snapshot;
  match: Match;
  event?: GameEvent;
  initialDraft?: EventDraft;
  voiceTimings?: {
    whistleMs: number;
    rulesMs: number;
    needleMs: number;
  };
  close: () => void;
}) {
  const [draft, setDraft] = useState<EventDraft>(
    () => initialDraft ?? createEditorDraft(data, match, event),
  );
  const action = useAction();
  const noteId = useId();
  const moreButton = useRef<HTMLButtonElement>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [moreActions, setMoreActions] = useState(false);
  const eventDefinition = draft.type ? definitions[draft.type] : null;
  const teamName = (id: string) => data.teams.find((team) => team.id === id)?.name ?? '';
  const setType = (type: EventType | null) =>
    setDraft((previousDraft) => ({
      ...previousDraft,
      type,
      teamId: type === 'note' ? null : previousDraft.teamId,
      metadata: {},
      relatedDorsal: '',
      primaryDorsal:
        type === 'passive' || type === 'note'
          ? ''
          : previousDraft.primaryDorsal ||
            (type === 'save'
              ? (lastGoalkeeper(match, data.players, previousDraft.teamId)?.dorsal?.toString() ??
                '')
              : ''),
    }));
  const relatedTeamId =
    draft.type && draft.teamId ? relatedTeam(match, draft.type, draft.teamId) : draft.teamId;
  const issues = eventDraftIssues(draft, match, data.players);
  const missing = issues.length > 0;
  const frequent: EventType[] = ['goal', 'save', 'loss', 'miss'];
  const actionChoices = (types: readonly EventType[]) =>
    types.map((value) => ({
      value,
      label: tr(definitions[value].label),
      content: (
        <>
          <EventIcon type={value} />
          <span>{tr(definitions[value].label)}</span>
        </>
      ),
    }));
  const selectTeam = (teamId: string) =>
    setDraft((previous) => ({
      ...previous,
      teamId,
      primaryDorsal:
        previous.type === 'save'
          ? (lastGoalkeeper(match, data.players, teamId)?.dorsal?.toString() ?? '')
          : '',
      relatedDorsal: '',
    }));
  return (
    <Modal
      className="event-editor"
      title={event ? tr('Editar evento') : tr('Nuevo evento')}
      close={() => !action.busy && close()}
    >
      <form
        onSubmit={(inputEvent) => {
          inputEvent.preventDefault();
          action.run(async () => {
            await repo.saveEvent(draft);
            close();
          });
        }}
      >
        <div className="event-editor-fields">
          <div className="event-context">
            <button
              type="button"
              aria-expanded={contextOpen}
              aria-controls="event-context-fields"
              onClick={() => setContextOpen(!contextOpen)}
            >
              {tr('Tiempo')} {draft.period} · {draft.minute}′ · {tr('Editar tiempo y minuto')}
            </button>
            {contextOpen && (
              <div id="event-context-fields" className="filter-row">
                <NumberWheel
                  label={tr('Minuto')}
                  value={draft.minute}
                  min={0}
                  max={999}
                  onChange={(minute) => setDraft((previous) => ({ ...previous, minute }))}
                />
                <WheelPicker
                  label={tr('Tiempo')}
                  value={String(draft.period)}
                  options={Array.from({ length: match.clock.period }, (_, index) => ({
                    value: String(index + 1),
                    label: tr('Tiempo') + ' ' + (index + 1),
                  }))}
                  change={(period) =>
                    setDraft((previous) => ({ ...previous, period: Number(period) }))
                  }
                />
              </div>
            )}
          </div>
          {draft.type !== 'note' && (
            <ChoiceGroup
              label={tr('Equipo')}
              value={draft.teamId ?? ''}
              className="team-choices"
              hint={
                issues.includes('Selecciona un equipo') ? tr('Selecciona un equipo') : undefined
              }
              options={[match.localTeamId, match.visitorTeamId].map((value, index) => ({
                value,
                label: teamName(value),
                accessibleLabel: teamName(value),
                description: tr(index === 0 ? 'Equipo 1 (nuestro)' : 'Equipo 2 (rival)'),
                content: (
                  <>
                    <span>{tr(index === 0 ? 'Equipo 1 (nuestro)' : 'Equipo 2 (rival)')}</span>
                    <strong>{teamName(value)}</strong>
                  </>
                ),
              }))}
              change={selectTeam}
            />
          )}
          <ChoiceGroup
            label={tr('Evento')}
            className="event-action-choices"
            hint={issues.includes('Selecciona un evento') ? tr('Selecciona un evento') : undefined}
            value={draft.type ?? ''}
            options={actionChoices(frequent)}
            change={(type) => setType(type as EventType)}
          />
          <button
            type="button"
            ref={moreButton}
            className="more-actions"
            aria-expanded={moreActions}
            onClick={() => setMoreActions(!moreActions)}
          >
            {tr('Más acciones')}
            {draft.type && !frequent.includes(draft.type)
              ? ' · ' + tr(definitions[draft.type].label)
              : ''}
          </button>
          {moreActions && (
            <ChoiceGroup
              label={tr('Más acciones')}
              className="event-action-choices"
              value={draft.type ?? ''}
              options={actionChoices(eventTypes.filter((type) => !frequent.includes(type)))}
              change={(type) => {
                setType(type as EventType);
                setMoreActions(false);
                moreButton.current?.focus({ preventScroll: true });
              }}
            />
          )}
          {draft.teamId && eventDefinition && draft.type !== 'passive' && draft.type !== 'note' && (
            <>
              <ParticipantPicker
                key={'primary:' + draft.teamId}
                role="primary"
                participantLabel={tr(eventDefinition.principal)}
                teamId={draft.teamId}
                teamName={teamName(draft.teamId)}
                players={data.players}
                shirtNumber={draft.primaryDorsal}
                change={(primaryDorsal) => setDraft((previous) => ({ ...previous, primaryDorsal }))}
              />
              {eventDefinition.related && relatedTeamId && (
                <details
                  className="related-participant"
                  open={draft.type === 'substitution' || draft.relatedDorsal !== '' || undefined}
                >
                  <summary>
                    {tr(eventDefinition.related)}
                    {draft.type === 'substitution' ? '' : ' · ' + tr('Opcional')}
                  </summary>
                  <ParticipantPicker
                    key={'related:' + relatedTeamId}
                    role="related"
                    participantLabel={tr(eventDefinition.related)}
                    teamId={relatedTeamId}
                    teamName={teamName(relatedTeamId)}
                    players={data.players}
                    shirtNumber={draft.relatedDorsal}
                    change={(relatedDorsal) =>
                      setDraft((previous) => ({ ...previous, relatedDorsal }))
                    }
                  />
                </details>
              )}
            </>
          )}
          <EventMetadata
            type={draft.type}
            metadata={draft.metadata}
            change={(metadata) => setDraft((previous) => ({ ...previous, metadata }))}
          />
          <details
            open={draft.type === 'note' || !!draft.note || !!draft.rawText || undefined}
            className="event-additional"
            aria-label={tr(
              draft.type === 'note' ? 'Nota del partido' : 'Información adicional (opcional)',
            )}
          >
            <summary>
              {tr(draft.type === 'note' ? 'Nota del partido' : 'Información adicional (opcional)')}
            </summary>
            {draft.type === 'note' && (
              <p className="caption">
                {tr('Se guarda en el registro, sin afectar al marcador ni a las estadísticas.')}
              </p>
            )}
            <label htmlFor={noteId}>{tr('Nota')}</label>
            <textarea
              id={noteId}
              maxLength={10000}
              rows={draft.type === 'note' ? 4 : 2}
              value={draft.note}
              placeholder={tr(
                draft.type === 'note'
                  ? 'Escribe el texto de la nota'
                  : 'Información adicional (opcional)',
              )}
              onChange={(inputEvent) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  note: inputEvent.target.value,
                }))
              }
            />
            {draft.rawText && (
              <p className="voice-transcript">
                <strong>{tr('Transcripción original')}</strong>
                <span>«{draft.rawText}»</span>
              </p>
            )}
          </details>
          {event && (
            <p className="caption">
              {tr('Cambiar minuto o tiempo recoloca el evento en orden cronológico.')}
            </p>
          )}
          {voiceTimings && (
            <p className="caption voice-diagnostics">
              {tr('Whistle: {whistle} s · Reglas: {rules} ms', {
                whistle: (voiceTimings.whistleMs / 1000).toFixed(1),
                rules: voiceTimings.rulesMs.toFixed(1),
              })}
            </p>
          )}
        </div>
        <footer className="event-editor-footer">
          <div
            className="draft-feedback"
            tabIndex={0}
            role="region"
            aria-label={tr('Resumen del evento')}
          >
            <p className="draft-summary">{draftSummary(draft, match, data)}</p>
            {missing && (
              <p className="draft-issues">
                {tr('Se guardará pendiente; no contará en las estadísticas.')}{' '}
                {issues.map((issue) => tr(issue)).join('. ')}
              </p>
            )}
          </div>
          <ErrorMessage text={action.error} />
          <div className="actions">
            <button type="button" disabled={action.busy} onClick={close}>
              {tr('Cancelar')}
            </button>
            <button className="primary" disabled={action.busy}>
              {action.busy
                ? tr('Guardando…')
                : missing
                  ? tr('Guardar pendiente')
                  : tr('Guardar evento')}
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}
