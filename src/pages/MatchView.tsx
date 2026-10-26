import { TabBar, TabPanel } from '../components/ui/TabBar';
import {
  MatchConfirmation,
  type MatchConfirmationIntent,
} from '../components/match/MatchConfirmation';
import { EventFeed } from '../components/EventFeed';
import { ExclusionTimers, type CounterPrefill } from '../components/ExclusionTimers';
import { tr } from '../i18n';
import { useId, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, Trash2, Flag, Timer, BellRing, ArrowLeft } from 'lucide-react';
import { repo } from '../data/database';
import type { EventUndo } from '../data/repository/event-undo';
import {
  chronological,
  elapsed,
  eventState,
  definitions,
  type GameEvent,
  type Match,
  type Snapshot,
} from '../domain/model';
import { exclusionRemaining, EXCLUSION_SLOT_COUNT } from '../domain/exclusions';
import { MATCH_TIME_LIMIT_MS } from '../domain/clock';
import { ErrorMessage, Modal, navigate, useAction } from '../components/ui';
import { VoiceCapture } from '../components/VoiceCapture';
import { EventEditor } from '../components/EventEditor';
import { Statistics } from '../components/Statistics';
import { teamName, formatMatchDate, matchScore } from '../presentation/matches';
function MatchView({ data, match }: { data: Snapshot; match: Match }) {
  const tabsId = useId();
  const [tab, setTab] = useState('events');
  const [namesOpen, setNamesOpen] = useState(false);
  const [editing, setEditing] = useState<GameEvent | 'new' | null>(null);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [confirm, setConfirm] = useState<MatchConfirmationIntent | null>(null);
  const pendingFilter = useRef<HTMLButtonElement>(null);
  const returnToFeed = useRef(false);
  const [notice, setNotice] = useState('');
  const [undo, setUndo] = useState<{ receipt: EventUndo; label: string } | null>(null);
  const undoAction = useAction();
  const manualButton = useRef<HTMLButtonElement>(null);
  const [counterOffer, setCounterOffer] = useState<(CounterPrefill & { updatedAt: number }) | null>(
    null,
  );
  const [counterRequest, setCounterRequest] = useState<CounterPrefill | null>(null);
  const returnToCounters = useRef(false);
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
  function eventSaved(event: GameEvent, pending: boolean, receipt?: EventUndo, primaryDorsal = '') {
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
    const label = [
      tr(event.type ? definitions[event.type].label : 'Evento sin indicar'),
      team,
      tr(pending ? '! Pendiente · no computa' : 'Evento guardado'),
    ]
      .filter(Boolean)
      .join(' · ');
    setNotice(label);
    setUndo(receipt ? { receipt, label } : null);
    undoAction.setError('');
    setCounterOffer(
      event.type === 'exclusion' && event.teamId && match.status === 'active'
        ? {
            eventId: event.id,
            updatedAt: event.updatedAt,
            teamId: event.teamId,
            dorsal: primaryDorsal,
          }
        : null,
    );
  }
  const [counterDialog, setCounterDialog] = useState(false);
  useLayoutEffect(() => {
    if (!counterDialog && returnToCounters.current) {
      returnToCounters.current = false;
      showCounters();
    }
  }, [counterDialog]);
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
  const elapsedMs =
    match.status === 'active'
      ? Math.min(elapsed(match.clock, now), MATCH_TIME_LIMIT_MS)
      : elapsed(match.clock, now);
  const header = useRef<HTMLElement>(null);
  const counters = (match.exclusions ?? []).filter((timer) => timer !== null);
  const expiredCount = counters.filter((timer) => exclusionRemaining(timer, now) === 0).length;
  const offer =
    counterOffer &&
    match.status === 'active' &&
    data.events.some(
      (event) =>
        event.id === counterOffer.eventId &&
        !event.deletedAt &&
        event.updatedAt === counterOffer.updatedAt,
    )
      ? counterOffer
      : null;
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
        <button className="back" aria-label={tr('Volver')} onClick={() => navigate('/partidos')}>
          <ArrowLeft size={18} />
        </button>
        <h1 aria-label={tr('Partido del {date}', { date: formatMatchDate(match.date) })}>
          {formatMatchDate(match.date)}
        </h1>
        <span className={`badge ${match.status === 'active' ? 'live' : ''}`}>
          {tr(match.status === 'active' ? 'En curso' : 'Finalizado')}
        </span>
      </div>
      <section ref={header} className="match-header panel">
        <div className="scoreboard">
          <div>
            <span className="eyebrow">{tr('Equipo 1 (nuestro)')}</span>
            <h2>
              <button
                className="team-name-button"
                onClick={() => setNamesOpen(true)}
                aria-haspopup="dialog"
                aria-label={teamName(data, match.localTeamId)}
              >
                <span>{teamName(data, match.localTeamId)}</span>
              </button>
            </h2>
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
            <h2>
              <button
                className="team-name-button"
                onClick={() => setNamesOpen(true)}
                aria-haspopup="dialog"
                aria-label={teamName(data, match.visitorTeamId)}
              >
                <span>{teamName(data, match.visitorTeamId)}</span>
              </button>
            </h2>
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
              {String(Math.floor(elapsedMs / 60000)).padStart(2, '0')}:
              {String(Math.floor(elapsedMs / 1000) % 60).padStart(2, '0')}
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
        <ExclusionTimers
          match={match}
          data={data}
          now={now}
          onDialogChange={setCounterDialog}
          periodAction={
            match.status === 'active' ? (
              <button onClick={() => setConfirm('period')}>{tr('Nuevo tiempo')}</button>
            ) : undefined
          }
          prefill={counterRequest}
          onPrefillHandled={() => setCounterRequest(null)}
          onPrefillStarted={() => {
            setCounterOffer(null);
            returnToCounters.current = true;
            setNotice(tr('Contador activado. La exclusión sigue en el registro.'));
          }}
        />
      </section>
      <TabBar
        id={tabsId}
        label={tr('Vista del partido')}
        className="match-tabs"
        value={tab}
        change={setTab}
        tabs={[
          {
            value: 'events',
            label: (
              <>
                {tr('Eventos')} <span>{events.length}</span>
              </>
            ),
          },
          { value: 'stats', label: tr('Estadísticas') },
        ]}
      />
      <ErrorMessage text={action.error} />
      <TabPanel id={tabsId} value="stats" selected={tab}>
        <section className="panel">
          <Statistics data={data} matchId={match.id} />
        </section>
      </TabPanel>
      <TabPanel id={tabsId} value="events" selected={tab}>
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
      </TabPanel>
      <div className="capture-bar">
        {(notice || undo || offer) && (
          <div
            className="capture-feedback"
            role="region"
            aria-label={tr('Acciones de la última jugada')}
            tabIndex={0}
          >
            <p role="status">{notice || undo?.label}</p>
            {undo && (
              <button
                type="button"
                disabled={undoAction.busy}
                onClick={() =>
                  void undoAction.run(async () => {
                    await repo.undoEventCreation(undo.receipt);
                    if (counterOffer?.eventId === undo.receipt.event.id) setCounterOffer(null);
                    setUndo(null);
                    setNotice(
                      tr(
                        undo.receipt.event.type === 'exclusion'
                          ? 'Creación deshecha. Los contadores se gestionan aparte.'
                          : 'Creación deshecha',
                      ),
                    );
                    manualButton.current?.focus({ preventScroll: true });
                  })
                }
              >
                {tr('Deshacer creación')}
              </button>
            )}
            {offer && (
              <button
                type="button"
                onClick={() => {
                  if (counters.length >= EXCLUSION_SLOT_COUNT) showCounters();
                  else {
                    setCounterDialog(true);
                    setCounterRequest(offer);
                  }
                }}
              >
                {tr(
                  counters.length >= EXCLUSION_SLOT_COUNT
                    ? 'Contadores llenos · Ver contadores'
                    : 'Iniciar contador de esta exclusión',
                )}
              </button>
            )}
            <ErrorMessage text={undoAction.error} />
          </div>
        )}
        <button
          ref={manualButton}
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
          allowReview={!editing && !confirm && !counterDialog && !counterRequest && !namesOpen}
        />
      </div>
      <div className="match-footer">
        {match.status === 'active' && (
          <button className="text-button" onClick={() => setConfirm('finish')}>
            <Flag size={16} /> {tr('Finalizar partido')}
          </button>
        )}
        <button className="text-button danger-text" onClick={() => setConfirm('delete')}>
          <Trash2 size={15} />
          {tr('Eliminar partido')}
        </button>
      </div>
      {namesOpen && (
        <Modal title={tr('Nombres de los equipos')} close={() => setNamesOpen(false)}>
          <dl className="match-team-names">
            <dt>{tr('Equipo 1 (nuestro)')}</dt>
            <dd>{teamName(data, match.localTeamId)}</dd>
            <dt>{tr('Equipo 2 (rival)')}</dt>
            <dd>{teamName(data, match.visitorTeamId)}</dd>
          </dl>
        </Modal>
      )}
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
