import { CircleHelp, Trash2 } from 'lucide-react';
import { useId, type RefObject } from 'react';
import { tr } from '../i18n';
import {
  definitions,
  eventState,
  eventIssues,
  type GameEvent,
  type Match,
  type Player,
  type Snapshot,
} from '../domain/model';
import { teamName } from '../presentation/matches';
import { Empty } from './ui';
import { EventIcon } from './EventIcon';

type EventActions = { onEdit: (event: GameEvent) => void; onDelete: (event: GameEvent) => void };
type EventFeedProps = EventActions & {
  data: Snapshot;
  match: Match;
  events: GameEvent[];
  pendingOnly: boolean;
  togglePending: () => void;
  filterRef?: RefObject<HTMLButtonElement | null>;
};

export function EventFeed({
  data,
  match,
  events,
  pendingOnly,
  togglePending,
  onEdit,
  onDelete,
  filterRef,
}: EventFeedProps) {
  const pendingEvents = events.filter(
    (event) => eventState(event, match, data.players) === 'pending',
  );
  const visibleEvents = pendingOnly ? pendingEvents : events;
  return (
    <section className="event-feed">
      <div className="section-heading">
        <h2>{tr('Registro de eventos')}</h2>
        <button
          ref={filterRef}
          className={`filter-chip ${pendingOnly ? 'active' : ''}`}
          aria-pressed={pendingOnly}
          onClick={togglePending}
        >
          {pendingOnly
            ? tr('Ver todos') + ' · ' + tr('{count} pendientes', { count: pendingEvents.length })
            : tr('{count} pendientes', { count: pendingEvents.length })}
        </button>
      </div>
      <p className="caption feed-order">{tr('Más recientes primero')}</p>
      {!visibleEvents.length && (
        <Empty
          title={pendingOnly ? tr('Sin eventos pendientes') : tr('Empieza con la primera jugada')}
        >
          <p>
            {pendingOnly
              ? tr('Todos los eventos tienen sus datos obligatorios.')
              : tr('Pulsa «Evento manual». Puedes completar los jugadores después.')}
          </p>
        </Empty>
      )}
      {visibleEvents.map((event) => (
        <EventCard
          key={event.id}
          data={data}
          match={match}
          event={event}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}

function EventCard({
  data,
  match,
  event,
  onEdit,
  onDelete,
}: EventActions & { data: Snapshot; match: Match; event: GameEvent }) {
  const id = useId();
  const state = eventState(event, match, data.players);
  const issues = eventIssues(event, match, data.players);
  const hasNote = event.note.trim().length > 0;
  const hasTranscript = event.rawText.trim().length > 0;
  const primaryPlayer = data.players.find((player) => player.id === event.primaryPlayerId);
  const incomingPlayer = data.players.find((player) => player.id === event.relatedPlayerId);
  const definition = event.type ? definitions[event.type] : undefined;
  const teamNumber =
    event.teamId === match.localTeamId ? 1 : event.teamId === match.visitorTeamId ? 2 : null;
  const side =
    event.type === 'note'
      ? 'match-note'
      : teamNumber === 1
        ? 'team-one'
        : teamNumber === 2
          ? 'team-two'
          : 'unassigned';
  const heading =
    event.type === 'note'
      ? tr('Nota del partido')
      : teamNumber !== null
        ? teamName(data, teamNumber === 1 ? match.localTeamId : match.visitorTeamId)
        : tr('Equipo pendiente');
  const metadata = [
    event.metadata.penalty ? '7 m' : '',
    event.metadata.infraction ? tr(event.metadata.infraction) : '',
    event.metadata.blue ? tr('Tarjeta azul') : '',
  ].filter(Boolean);
  const showPlayer = event.type !== 'passive' && event.type !== 'note';
  const relatedRole =
    definition?.related &&
    (event.type === 'substitution' || (incomingPlayer && !incomingPlayer.isUnknown))
      ? definition.related
      : null;
  return (
    <article
      className={`event-card ${side} ${state}`}
      data-event-id={event.id}
      data-team={teamNumber ?? 'none'}
      aria-labelledby={`${id}-team ${id}-event`}
    >
      <header className="event-team" id={`${id}-team`}>
        <strong className="event-team-name">{heading}</strong>
        {teamNumber !== null && (
          <span className="event-team-label">{tr('Equipo {number}', { number: teamNumber })}</span>
        )}
      </header>
      <div className="event-body">
        <div className="event-icon" aria-hidden="true">
          {event.type ? <EventIcon type={event.type} /> : <CircleHelp size={34} />}
        </div>
        <div className="event-copy">
          <div className="event-heading">
            <strong className="event-title" id={`${id}-event`}>
              {definition ? tr(definition.label) : tr('Evento sin indicar')}
            </strong>
            <time
              aria-label={tr('Tiempo {period} · Minuto {minute}', {
                period: event.period,
                minute: event.minute,
              })}
            >
              T{event.period} · {event.minute}′
            </time>
          </div>
          {showPlayer && (
            <p className="event-player">
              {event.type === 'substitution' && (
                <span className="event-player-role">{tr('Sale')}: </span>
              )}
              {playerLabel(primaryPlayer)}
            </p>
          )}
          {relatedRole && (
            <p className="event-player">
              <span className="event-player-role">{tr(relatedRole)}: </span>
              {playerLabel(incomingPlayer)}
            </p>
          )}
        </div>
      </div>
      {(hasNote || hasTranscript) && (
        <details className="event-details">
          <summary>
            {tr(
              hasNote && hasTranscript
                ? 'Ver nota y transcripción'
                : hasNote
                  ? 'Ver nota'
                  : 'Ver transcripción original',
            )}
          </summary>
          {hasNote && (
            <div>
              <strong>{tr('Nota')}</strong>
              <p className="event-note">{event.note}</p>
            </div>
          )}
          {hasTranscript && (
            <div>
              <strong>{tr('Transcripción original')}</strong>
              <p className="event-original">{event.rawText}</p>
            </div>
          )}
        </details>
      )}
      <div className="event-bottom">
        {state === 'pending' && <p className="event-status">{tr('! Pendiente · no computa')}</p>}
        {issues.length > 0 && (
          <ul className="event-issues">
            {issues.map((issue) => (
              <li key={issue}>{tr(issue)}</li>
            ))}
          </ul>
        )}
        {metadata.length > 0 && (
          <p className="event-metadata">
            {metadata.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </p>
        )}
        <div className="event-actions">
          <button className="text-button" onClick={() => onEdit(event)}>
            {tr(state === 'pending' ? 'Completar' : 'Editar')}
          </button>
          <button
            className="icon-button delete-event"
            aria-label={tr('Eliminar {event} del minuto {minute}', {
              event: tr(definition?.label ?? 'Evento'),
              minute: event.minute,
            })}
            title={tr('Eliminar evento')}
            onClick={() => onDelete(event)}
          >
            <Trash2 size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function playerLabel(player: Player | undefined): string {
  if (!player || player.isUnknown) {
    return tr('Sin identificar');
  }
  return `#${player.dorsal} · ${player.name || tr('Sin nombre')}`;
}
