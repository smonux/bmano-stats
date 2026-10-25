import { Trash2 } from 'lucide-react';
import { tr } from '../i18n';
import {
  definitions,
  eventState,
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
};

export function EventFeed({
  data,
  match,
  events,
  pendingOnly,
  togglePending,
  onEdit,
  onDelete,
}: EventFeedProps) {
  const pendingEvents = events.filter(
    (event) => eventState(event, match, data.players) === 'pending',
  );
  const visibleEvents = pendingOnly ? pendingEvents : events;
  return (
    <section className="event-feed">
      <div className="section-heading">
        <h2>{tr('Registro de eventos')}</h2>
        <button className={`filter-chip ${pendingOnly ? 'active' : ''}`} onClick={togglePending}>
          {pendingOnly
            ? tr('Ver todos')
            : tr('{count} pendientes', { count: pendingEvents.length })}
        </button>
      </div>
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
  const state = eventState(event, match, data.players);
  const primaryPlayer = data.players.find((player) => player.id === event.primaryPlayerId);
  const incomingPlayer = data.players.find((player) => player.id === event.relatedPlayerId);
  const definition = event.type ? definitions[event.type] : undefined;
  let side = 'unassigned';
  let teamNumber: number | null = null;
  let perspectiveLabel = '';
  if (event.teamId === match.localTeamId) {
    side = 'home';
    teamNumber = 1;
    perspectiveLabel = tr('Equipo 1 (nuestro)');
  } else if (event.teamId === match.visitorTeamId) {
    side = 'away';
    teamNumber = 2;
    perspectiveLabel = tr('Equipo 2 (rival)');
  }
  let statusLabel = tr('✓ Registrado');
  if (state === 'pending') {
    statusLabel = tr('! Pendiente · no computa');
  } else if (state === 'unidentified') {
    statusLabel = tr('✓ Registrado · sin identificar');
  }
  return (
    <article className={`event-card ${side} ${state}`}>
      <div className="event-icon" aria-hidden="true">
        {event.type ? <EventIcon type={event.type} /> : '?'}
      </div>
      <div className="event-copy">
        <div className="event-heading">
          <strong className="event-title">
            {definition ? tr(definition.label) : tr('Evento sin indicar')}
          </strong>
          <time>
            T{event.period} · {event.minute}′
          </time>
        </div>
        <p>
          <span className="event-team">
            {teamNumber !== null && (
              <span
                className="event-team-number"
                role="img"
                aria-label={perspectiveLabel}
                title={perspectiveLabel}
              >
                {teamNumber}
              </span>
            )}
            <b className="event-team-name">
              {event.type === 'note'
                ? tr('Nota del partido')
                : event.teamId
                  ? teamName(data, event.teamId)
                  : tr('Equipo pendiente')}
            </b>
          </span>
          {event.type !== 'passive' && event.type !== 'note' && (
            <>
              {' '}
              · {event.type === 'substitution' && `${tr('Sale')} `}
              {playerLabel(primaryPlayer)}
              {event.type === 'substitution' && (
                <>
                  {' '}
                  → {tr('Entra')} {playerLabel(incomingPlayer)}
                </>
              )}
            </>
          )}
        </p>
        {event.type === 'note' && <p className="event-note">{event.note}</p>}
        <div className="event-bottom">
          <span className="caption">
            {statusLabel}
            {event.metadata.penalty ? ' · 7 m' : ''}
            {event.metadata.infraction ? ' · ' + tr(event.metadata.infraction) : ''}
          </span>
          <button className="text-button" onClick={() => onEdit(event)}>
            {tr('Editar')}
          </button>
          <button
            className="icon-button delete-event"
            aria-label={tr('Eliminar {event} del minuto {minute}', {
              event: tr(definition?.label ?? 'Evento'),
              minute: event.minute,
            })}
            onClick={() => onDelete(event)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function playerLabel(player: Player | undefined): string {
  if (!player || player.isUnknown) {
    return tr('Desconocido');
  }
  return `#${player.dorsal}${player.name ? ' ' + player.name : ''}`;
}
