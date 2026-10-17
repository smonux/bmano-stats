import { WheelPicker } from './WheelPicker';
import { tr } from '../i18n';
import { useState } from 'react';
import {
  definitions,
  elapsed,
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
  voiceTimings?: { whistleMs: number; rulesMs: number };
  close: () => void;
}) {
  const shirtNumberForPlayer = (id: string | null) =>
    data.players.find((candidatePlayer) => candidatePlayer.id === id)?.dorsal?.toString() ?? '';
  const [draft, setDraft] = useState<EventDraft>(
    () =>
      initialDraft ?? {
        id: event?.id,
        expectedUpdatedAt: event?.updatedAt,
        matchId: match.id,
        type: event?.type ?? null,
        teamId: event?.teamId ?? null,
        primaryDorsal: shirtNumberForPlayer(event?.primaryPlayerId ?? null),
        relatedDorsal: shirtNumberForPlayer(event?.relatedPlayerId ?? null),
        minute: event?.minute ?? Math.min(999, Math.floor(elapsed(match.clock) / 60000)),
        period: event?.period ?? match.clock.period,
        metadata: event?.metadata ?? {},
        note: event?.note ?? '',
        rawText: event?.rawText ?? '',
      },
  );
  const action = useAction();
  const eventDefinition = draft.type ? definitions[draft.type] : null;
  const teamName = (id: string) => data.teams.find((t) => t.id === id)?.name ?? '';
  const setType = (type: EventType | null) =>
    setDraft((previousDraft) => ({
      ...previousDraft,
      type,
      metadata: {},
      relatedDorsal: '',
      primaryDorsal: type === 'passive' ? '' : previousDraft.primaryDorsal,
    }));
  const participant = (related: boolean) => {
    const enabled =
      !!draft.teamId &&
      !!eventDefinition &&
      (related ? !!eventDefinition.related : draft.type !== 'passive');
    const participantTeamId =
      related && draft.type && draft.teamId
        ? relatedTeam(match, draft.type, draft.teamId)
        : draft.teamId;
    const shirtNumber = related ? draft.relatedDorsal : draft.primaryDorsal;
    const dorsalField = related ? 'relatedDorsal' : 'primaryDorsal';
    const knownPlayers = data.players
      .filter(
        (candidatePlayer) =>
          candidatePlayer.teamId === participantTeamId &&
          !candidatePlayer.isUnknown &&
          !candidatePlayer.deletedAt,
      )
      .sort((a, b) => a.dorsal! - b.dorsal!);
    const player = knownPlayers.find(
      (candidatePlayer) => candidatePlayer.dorsal === Number(shirtNumber) && shirtNumber !== '',
    );
    return (
      <fieldset disabled={!enabled} className="participant">
        <legend>
          {related ? tr('Relacionado') : tr('Principal')} ·{' '}
          {related
            ? tr(eventDefinition?.related ?? 'No aplica')
            : tr(eventDefinition?.principal ?? 'Jugador')}
        </legend>
        <div className="participant-row">
          <span className="participant-team">
            {participantTeamId ? teamName(participantTeamId) : tr('Sin equipo')}
          </span>
          <label className="sr-only" htmlFor={dorsalField}>
            {related ? tr('Dorsal relacionado') : tr('Dorsal principal')}
          </label>
          <input
            id={dorsalField}
            inputMode="numeric"
            pattern="[0-9]{1,2}"
            maxLength={2}
            placeholder="Nº"
            value={shirtNumber}
            onChange={(inputEvent) =>
              setDraft((previousDraft) => ({
                ...previousDraft,
                [dorsalField]: inputEvent.target.value.replace(/\D/g, '').slice(0, 2),
              }))
            }
          />
          <select
            aria-label={related ? tr('Jugador relacionado') : tr('Jugador principal')}
            value={player ? shirtNumber : ''}
            onChange={(inputEvent) =>
              setDraft((previousDraft) => ({
                ...previousDraft,
                [dorsalField]: inputEvent.target.value,
              }))
            }
          >
            <option value="">{shirtNumber ? tr('Dorsal nuevo') : tr('Desconocido')}</option>
            {knownPlayers.map((candidatePlayer) => (
              <option key={candidatePlayer.id} value={String(candidatePlayer.dorsal)}>
                #{candidatePlayer.dorsal} {candidatePlayer.name}
              </option>
            ))}
          </select>
        </div>
        <small>
          {!enabled
            ? tr('No aplicable')
            : shirtNumber
              ? player?.name ||
                tr('Dorsal {number} válido · nombre opcional', { number: Number(shirtNumber) })
              : tr('Sin dorsal: se atribuye a Desconocido cuando corresponda.')}
        </small>
      </fieldset>
    );
  };
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
        {voiceTimings && (
          <p className="caption">
            {tr('Whistle: {whistle} s · Reglas: {rules} ms', {
              whistle: (voiceTimings.whistleMs / 1000).toFixed(1),
              rules: voiceTimings.rulesMs.toFixed(1),
            })}
          </p>
        )}
        {voiceWarnings && draft.rawText && (
          <p className="voice-transcript">
            <strong>{tr('Transcripción original')}</strong>
            <span>«{draft.rawText}»</span>
          </p>
        )}
        {voiceWarnings && (
          <ul className="voice-warnings">
            {voiceWarnings.map((w) => (
              <li key={w}>{tr(w)}</li>
            ))}
          </ul>
        )}
        <div className="event-top">
          <WheelPicker
            label={tr('Evento')}
            value={draft.type ?? ''}
            options={[
              { value: '', label: tr('Seleccionar evento') },
              ...eventTypes.map((value) => ({ value, label: tr(definitions[value].label) })),
            ]}
            change={(value) => setType((value as EventType) || null)}
          />
          <NumberWheel
            label={tr('Minuto')}
            value={draft.minute}
            min={0}
            max={999}
            onChange={(minute) => setDraft((previousDraft) => ({ ...previousDraft, minute }))}
          />
        </div>
        <div className="filter-row">
          <label>
            {tr('Equipo')}
            <select
              aria-label={tr('Equipo')}
              value={draft.teamId ?? ''}
              onChange={(inputEvent) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  teamId: inputEvent.target.value || null,
                  primaryDorsal: '',
                  relatedDorsal: '',
                }))
              }
            >
              <option value="">{tr('Seleccionar equipo')}</option>
              {[match.localTeamId, match.visitorTeamId].map((id) => (
                <option key={id} value={id}>
                  {teamName(id)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr('Tiempo')}
            <select
              aria-label={tr('Tiempo')}
              value={draft.period}
              onChange={(inputEvent) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  period: Number(inputEvent.target.value),
                }))
              }
            >
              {Array.from({ length: match.clock.period }, (_, i) => (
                <option key={i} value={i + 1}>
                  {tr('Tiempo')} {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        {participant(false)}
        {participant(true)}
        <div className="metadata">
          <label className={!eventDefinition?.penalty ? 'disabled' : ''}>
            <span>{tr('Penalti (7 m)')}</span>
            <input
              type="checkbox"
              disabled={!eventDefinition?.penalty}
              checked={!!draft.metadata.penalty && !!eventDefinition?.penalty}
              onChange={(inputEvent) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  metadata: { ...previousDraft.metadata, penalty: inputEvent.target.checked },
                }))
              }
            />
          </label>
          <label className={draft.type !== 'disqualification' ? 'disabled' : ''}>
            <span>{tr('Tarjeta azul')}</span>
            <input
              type="checkbox"
              disabled={draft.type !== 'disqualification'}
              checked={!!draft.metadata.blue && draft.type === 'disqualification'}
              onChange={(inputEvent) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  metadata: { ...previousDraft.metadata, blue: inputEvent.target.checked },
                }))
              }
            />
          </label>
          <label className={draft.type !== 'infraction' ? 'disabled' : ''}>
            {tr('Tipo de infracción')}
            <select
              aria-label={tr('Tipo de infracción')}
              disabled={draft.type !== 'infraction'}
              value={draft.metadata.infraction ?? ''}
              onChange={(inputEvent) =>
                setDraft((previousDraft) => ({
                  ...previousDraft,
                  metadata: {
                    ...previousDraft.metadata,
                    infraction:
                      (inputEvent.target.value as 'Pasos' | 'Dobles' | 'Pisando') || undefined,
                  },
                }))
              }
            >
              <option value="">{tr('Sin indicar')}</option>
              {['Pasos', 'Dobles', 'Pisando'].map((t) => (
                <option key={t} value={t}>
                  {tr(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {tr('Nota')}
          <textarea
            maxLength={10000}
            rows={2}
            value={draft.note}
            placeholder={tr('Información adicional (opcional)')}
            onChange={(inputEvent) =>
              setDraft((previousDraft) => ({ ...previousDraft, note: inputEvent.target.value }))
            }
          />
        </label>
        {draft.rawText && !voiceWarnings && (
          <p className="caption">
            {tr('Transcripción original')}: «{draft.rawText}»
          </p>
        )}
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
      </form>
    </Modal>
  );
}
