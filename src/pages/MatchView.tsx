import {
  MatchConfirmation,
  type MatchConfirmationIntent,
} from '../components/match/MatchConfirmation';
import { EventFeed } from '../components/EventFeed';
import { ExclusionTimers } from '../components/ExclusionTimers';
import { tr } from '../i18n';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, Trash2, Flag, Timer, BellRing } from 'lucide-react';
import { repo } from '../data/database';
import {
  chronological,
  elapsed,
  eventState,
  definitions,
  type GameEvent,
  type Match,
  type Snapshot,
} from '../domain/model';
import { exclusionRemaining } from '../domain/exclusions';
import { ErrorMessage, PageTitle, useAction } from '../components/ui';
import { VoiceCapture } from '../components/VoiceCapture';
import { EventEditor } from '../components/EventEditor';
import { Statistics } from '../components/Statistics';
import { teamName, formatMatchDate, matchScore } from '../presentation/matches';
function MatchView({ data, match }: { data: Snapshot; match: Match }) {
  const [tab, setTab] = useState('events');
  const [editing, setEditing] = useState<GameEvent | 'new' | null>(null);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [confirm, setConfirm] = useState<MatchConfirmationIntent | null>(null);
  const pendingFilter = useRef<HTMLButtonElement>(null);
  const returnToFeed = useRef(false);
  const [notice, setNotice] = useState('');
  useLayoutEffect(() => {
    if (!editing && !confirm && returnToFeed.current) {
      returnToFeed.current = false;
      const button = pendingFilter.current;
      if (!button) return;
      button.focus({ preventScroll: true });
      const rect = button.getBoundingClientRect();
      const sticky = document.querySelector('.match-header');
      const top =
        sticky && getComputedStyle(sticky).position === 'sticky'
          ? sticky.getBoundingClientRect().bottom + 8
          : 8;
      const bottom =
        document.querySelector('.capture-bar')?.getBoundingClientRect().top ?? innerHeight;
      if (rect.top < top) window.scrollBy(0, rect.top - top);
      else if (rect.bottom > bottom) window.scrollBy(0, rect.bottom - bottom + 8);
    }
  }, [editing, confirm]);
  function eventSaved(event: GameEvent, pending: boolean) {
    returnToFeed.current = Boolean(
      pendingOnly &&
      editing &&
      editing !== 'new' &&
      eventState(editing, match, data.players) === 'pending',
    );
    const team =
      event.teamId === match.localTeamId
        ? tr('Equipo 1 (nuestro)')
        : event.teamId === match.visitorTeamId
          ? tr('Equipo 2 (rival)')
          : '';
    setNotice(
      [
        tr(event.type ? definitions[event.type].label : 'Evento sin indicar'),
        team,
        tr(pending ? '! Pendiente · no computa' : 'Evento guardado'),
      ]
        .filter(Boolean)
        .join(' · '),
    );
  }
  const [counterDialog, setCounterDialog] = useState(false);
  const action = useAction();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const events = data.events
    .filter((event) => event.matchId === match.id && !event.deletedAt)
    .sort(chronological)
    .reverse();
  const scores = matchScore(data, match);
  const header = useRef<HTMLElement>(null);
  const counters = (match.exclusions ?? []).filter((timer) => timer !== null);
  const expiredCount = counters.filter((timer) => exclusionRemaining(timer, now) === 0).length;
  function showCounters() {
    const section = document.getElementById('match-exclusions-' + match.id);
    if (!section) return;
    const stickyHeight =
      header.current && getComputedStyle(header.current).position === 'sticky'
        ? header.current.getBoundingClientRect().height
        : 0;
    window.scrollTo({
      top: Math.max(0, window.scrollY + section.getBoundingClientRect().top - stickyHeight - 12),
    });
    section.focus({ preventScroll: true });
  }
  return (
    <>
      <div className="match-page-title">
        <PageTitle
          title={match.status === 'active' ? tr('Partido en curso') : tr('Detalle del partido')}
          subtitle={formatMatchDate(match.date)}
          back="/partidos"
        >
          <span className={`badge ${match.status === 'active' ? 'live' : ''}`}>
            {match.status === 'active' ? tr('En curso') : tr('Finalizado')}
          </span>
        </PageTitle>
      </div>
      <section ref={header} className="match-header panel">
        <div className="scoreboard">
          <div>
            <span className="eyebrow">{tr('Equipo 1 (nuestro)')}</span>
            <h2>{teamName(data, match.localTeamId)}</h2>
          </div>
          <strong
            aria-label={tr('Marcador {a} a {b}', {
              a: scores[0],
              b: scores[1],
            })}
            className="score"
          >
            {scores[0]}
            <span>:</span>
            {scores[1]}
          </strong>
          <div>
            <span className="eyebrow">{tr('Equipo 2 (rival)')}</span>
            <h2>{teamName(data, match.visitorTeamId)}</h2>
          </div>
        </div>
        <div className="clock-row">
          <div className="clock-reading">
            <span className="clock-phase">
              <span className={match.clock.startedAt === null ? 'clock-dot paused' : 'clock-dot'} />
              <strong>
                {tr('Tiempo')} {match.clock.period}
              </strong>
              <small>{tr(match.clock.startedAt === null ? 'Pausado' : 'En juego')}</small>
            </span>
            <span className="minute" role="timer" aria-label={tr('Reloj del partido')}>
              {String(Math.floor(elapsed(match.clock, now) / 60000)).padStart(2, '0')}:
              {String(Math.floor(elapsed(match.clock, now) / 1000) % 60).padStart(2, '0')}
            </span>
          </div>
          {match.status === 'active' && (
            <div className="clock-actions">
              {counters.length > 0 && (
                <button
                  className={expiredCount ? 'exclusion-access needs-attention' : 'exclusion-access'}
                  aria-label={tr(
                    counters.length === 1
                      ? 'Ver contador de exclusión'
                      : 'Ver {count} contadores de exclusión',
                    { count: counters.length },
                  )}
                  aria-description={
                    expiredCount
                      ? tr(expiredCount === 1 ? 'Puede volver' : '{count} pueden volver', {
                          count: expiredCount,
                        })
                      : undefined
                  }
                  onClick={showCounters}
                >
                  {expiredCount ? (
                    <BellRing size={20} aria-hidden="true" />
                  ) : (
                    <Timer size={20} aria-hidden="true" />
                  )}
                  <b>{counters.length}</b>
                </button>
              )}
              <button
                aria-label={match.clock.startedAt === null ? tr('Reanudar') : tr('Parar')}
                title={match.clock.startedAt === null ? tr('Reanudar') : tr('Parar')}
                disabled={action.busy}
                onClick={() =>
                  action.run(() =>
                    repo.clock(match.id, match.clock.startedAt === null ? 'resume' : 'pause'),
                  )
                }
              >
                {match.clock.startedAt === null ? <Play size={20} /> : <Pause size={20} />}{' '}
                <span className="clock-action-label">
                  {match.clock.startedAt === null ? tr('Reanudar') : tr('Parar')}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="match-controls panel">
        <div className="match-secondary-actions">
          <details className="match-team-names">
            <summary>{tr('Nombres de los equipos')}</summary>
            <dl>
              <dt>{tr('Equipo 1 (nuestro)')}</dt>
              <dd>{teamName(data, match.localTeamId)}</dd>
              <dt>{tr('Equipo 2 (rival)')}</dt>
              <dd>{teamName(data, match.visitorTeamId)}</dd>
            </dl>
          </details>
          {match.status === 'active' && (
            <button onClick={() => setConfirm('period')}>{tr('Nuevo tiempo')}</button>
          )}
        </div>
        <ExclusionTimers match={match} data={data} now={now} onDialogChange={setCounterDialog} />
      </section>
      <div className="tabs match-tabs" role="tablist" aria-label={tr('Vista del partido')}>
        <button
          role="tab"
          aria-selected={tab === 'events'}
          className={tab === 'events' ? 'selected' : ''}
          onClick={() => setTab('events')}
        >
          {tr('Eventos')} <span>{events.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'stats'}
          className={tab === 'stats' ? 'selected' : ''}
          onClick={() => setTab('stats')}
        >
          {tr('Estadísticas')}
        </button>
      </div>
      <ErrorMessage text={action.error} />
      {tab === 'stats' ? (
        <section className="panel">
          <Statistics data={data} matchId={match.id} />
        </section>
      ) : (
        <EventFeed
          data={data}
          match={match}
          filterRef={pendingFilter}
          events={events}
          pendingOnly={pendingOnly}
          togglePending={() => setPendingOnly(!pendingOnly)}
          onEdit={(event) => {
            setNotice('');
            setEditing(event);
          }}
          onDelete={(event) => {
            setNotice('');
            setConfirm(event);
          }}
        />
      )}
      <div className="capture-bar">
        {notice && (
          <p className="capture-feedback" role="status">
            {notice}
          </p>
        )}
        <button
          className="primary"
          onClick={() => {
            setNotice('');
            setEditing('new');
          }}
        >
          <Plus size={19} /> {tr('Evento manual')}
        </button>
        <VoiceCapture
          key={match.id}
          data={data}
          match={match}
          saved={eventSaved}
          started={() => setNotice('')}
          allowReview={!editing && !confirm && !counterDialog}
        />
      </div>
      <div className="match-footer">
        {match.status === 'active' && (
          <button className="text-button" onClick={() => setConfirm('finish')}>
            <Flag size={16} /> {tr('Finalizar partido')}
          </button>
        )}
        <details className="match-more">
          <summary>{tr('Más acciones del partido')}</summary>
          <button className="text-button danger-text" onClick={() => setConfirm('delete')}>
            <Trash2 size={15} />
            {tr('Eliminar partido')}
          </button>
        </details>
      </div>
      {editing && (
        <EventEditor
          key={editing === 'new' ? 'new' : editing.id}
          data={data}
          match={match}
          saved={eventSaved}
          event={editing === 'new' ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}{' '}
      {confirm && (
        <MatchConfirmation
          deleted={() => {
            returnToFeed.current = true;
          }}
          data={data}
          intent={confirm}
          match={match}
          close={() => setConfirm(null)}
        />
      )}
    </>
  );
}
export { MatchView };
