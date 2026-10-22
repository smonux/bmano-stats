import { createEditorDraft } from './event-editor/draft';
import { WheelPicker } from './WheelPicker';
import { ParticipantPicker } from './event-editor/ParticipantPicker';
import { EventMetadata } from './event-editor/EventMetadata';
import { tr } from '../i18n';
import { useState } from 'react';
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
  voiceWarnings,
  voiceTimings,
  close,
}: {
  data: Snapshot;
  match: Match;
  event?: GameEvent;
  initialDraft?: EventDraft;
  voiceWarnings?: string[];
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
  const eventDefinition = draft.type ? definitions[draft.type] : null;
  const teamName = (id: string) => data.teams.find((team) => team.id === id)?.name ?? '';
  const setType = (type: EventType | null) =>
    setDraft((previousDraft) => ({
      ...previousDraft,
      type,
      metadata: {},
      relatedDorsal: '',
      primaryDorsal: type === 'passive' ? '' : previousDraft.primaryDorsal,
    }));
  const relatedTeamId =
    draft.type && draft.teamId ? relatedTeam(match, draft.type, draft.teamId) : draft.teamId;
  const duplicate =
    draft.type === 'substitution' &&
    draft.primaryDorsal !== '' &&
    draft.relatedDorsal !== '' &&
    Number(draft.primaryDorsal) === Number(draft.relatedDorsal);
  const missing =
    duplicate ||
    !draft.type ||
    !draft.teamId ||
    (draft.type === 'infraction' && !draft.metadata.infraction);
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
          {voiceWarnings && (
            <ul className="voice-warnings">
              {voiceWarnings.map((warning) => (
                <li key={warning}>{tr(warning)}</li>
              ))}
            </ul>
          )}
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
                  primaryDorsal: '',
                  relatedDorsal: '',
                }))
              }
            />
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
          <section className="event-additional" aria-label={tr('Información adicional (opcional)')}>
            <h3>{tr('Información adicional (opcional)')}</h3>
            <label>
              {tr('Nota')}
              <textarea
                maxLength={10000}
                rows={2}
                value={draft.note}
                placeholder={tr('Información adicional (opcional)')}
                onChange={(inputEvent) =>
                  setDraft((previousDraft) => ({
                    ...previousDraft,
                    note: inputEvent.target.value,
                  }))
                }
              />
            </label>
            {draft.rawText && (
              <p className="voice-transcript">
                <strong>{tr('Transcripción original')}</strong>
                <span>«{draft.rawText}»</span>
              </p>
            )}
          </section>
          {duplicate && (
            <p className="pending-hint">
              {tr('El jugador que sale y el que entra deben ser distintos.')}
            </p>
          )}
          {missing && (
            <p className="pending-hint">
              {tr(
                'Faltan datos obligatorios. Puedes guardar el evento pendiente; no contará en las estadísticas.',
              )}
            </p>
          )}
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
