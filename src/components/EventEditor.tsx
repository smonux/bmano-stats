import { createEditorDraft } from './event-editor/draft';
import { eventDraftIssues } from '../presentation/event-draft';
import { lastGoalkeeper } from '../domain/goalkeepers';
import { WheelPicker } from './WheelPicker';
import { EventIcon } from './EventIcon';
import { ParticipantPicker } from './event-editor/ParticipantPicker';
import { EventMetadata } from './event-editor/EventMetadata';
import { tr } from '../i18n';
import { useId, useState } from 'react';
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
  const missing = eventDraftIssues(draft, match, data.players).length > 0;
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
          <div className="event-top">
            <WheelPicker<EventType | ''>
              label={tr('Evento')}
              value={draft.type ?? ''}
              options={[
                {
                  value: '',
                  label: tr('Seleccionar evento'),
                },
                ...eventTypes.map((value) => ({
                  value,
                  label: tr(definitions[value].label),
                  icon: <EventIcon type={value} />,
                })),
              ]}
              change={(value) => setType(value || null)}
            />
            <NumberWheel
              label={tr('Minuto')}
              value={draft.minute}
              min={0}
              max={999}
              onChange={(minute) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  minute,
                }))
              }
            />
          </div>
          <div className="filter-row">
            {draft.type !== 'note' && (
              <WheelPicker
                label={tr('Equipo')}
                value={draft.teamId ?? ''}
                options={[
                  {
                    value: '',
                    label: tr('Seleccionar equipo'),
                  },
                  ...[match.localTeamId, match.visitorTeamId].map((value) => ({
                    value,
                    label: teamName(value),
                  })),
                ]}
                change={(teamId) =>
                  setDraft((previousDraft) => ({
                    ...previousDraft,
                    teamId: teamId || null,
                    primaryDorsal:
                      draft.type === 'save'
                        ? (lastGoalkeeper(match, data.players, teamId)?.dorsal?.toString() ?? '')
                        : '',
                    relatedDorsal: '',
                  }))
                }
              />
            )}
            <WheelPicker
              label={tr('Tiempo')}
              value={String(draft.period)}
              options={Array.from(
                {
                  length: match.clock.period,
                },
                (_, index) => ({
                  value: String(index + 1),
                  label: tr('Tiempo') + ' ' + (index + 1),
                }),
              )}
              change={(period) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  period: Number(period),
                }))
              }
            />
          </div>
          {draft.type !== 'note' && (
            <>
              <ParticipantPicker
                role="primary"
                participantLabel={tr(eventDefinition?.principal ?? 'Jugador')}
                teamId={draft.teamId}
                teamName={draft.teamId ? teamName(draft.teamId) : ''}
                players={data.players}
                shirtNumber={draft.primaryDorsal}
                disabled={!draft.teamId || !eventDefinition || draft.type === 'passive'}
                change={(primaryDorsal) =>
                  setDraft((previousDraft) => ({
                    ...previousDraft,
                    primaryDorsal,
                  }))
                }
              />
              <ParticipantPicker
                role="related"
                participantLabel={tr(eventDefinition?.related ?? 'No aplica')}
                teamId={relatedTeamId}
                teamName={relatedTeamId ? teamName(relatedTeamId) : ''}
                players={data.players}
                shirtNumber={draft.relatedDorsal}
                disabled={!draft.teamId || !eventDefinition?.related}
                change={(relatedDorsal) =>
                  setDraft((previousDraft) => ({
                    ...previousDraft,
                    relatedDorsal,
                  }))
                }
              />
              <EventMetadata
                type={draft.type}
                metadata={draft.metadata}
                change={(metadata) =>
                  setDraft((previousDraft) => ({
                    ...previousDraft,
                    metadata,
                  }))
                }
              />
            </>
          )}
          <section
            className="event-additional"
            aria-label={tr(
              draft.type === 'note' ? 'Nota del partido' : 'Información adicional (opcional)',
            )}
          >
            <h3>
              {tr(draft.type === 'note' ? 'Nota del partido' : 'Información adicional (opcional)')}
            </h3>
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
          </section>
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
