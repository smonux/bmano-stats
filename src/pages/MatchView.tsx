import {
  MatchConfirmation,
  type MatchConfirmationIntent,
} from '../components/match/MatchConfirmation';
import { EventFeed } from '../components/EventFeed';
import { ExclusionTimers } from '../components/ExclusionTimers';
import { tr } from '../i18n';
import { useEffect, useState } from 'react';
import { Pause, Play, Plus, Trash2, Flag } from 'lucide-react';
import { repo } from '../data/database';
import { chronological, elapsed, type GameEvent, type Match, type Snapshot } from '../domain/model';
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
      <section className="match-header panel">
        <div className="scoreboard">
          <div>
            <span className="eyebrow">{tr('EQUIPO 1 · NOSOTROS')}</span>
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
            <span className="eyebrow">{tr('EQUIPO 2 · RIVAL')}</span>
            <h2>{teamName(data, match.visitorTeamId)}</h2>
          </div>
        </div>
        <div className="clock-row">
          <div>
            <span className={match.clock.startedAt === null ? 'clock-dot paused' : 'clock-dot'} />
            <strong>
              {tr('Tiempo')} {match.clock.period}
            </strong>
            <span className="minute" role="timer" aria-label={tr('Reloj del partido')}>
              {String(Math.floor(elapsed(match.clock, now) / 60000)).padStart(2, '0')}:
              {String(Math.floor(elapsed(match.clock, now) / 1000) % 60).padStart(2, '0')}
            </span>
            {match.clock.startedAt === null && <small>{tr('Pausado')}</small>}
          </div>
          {match.status === 'active' && (
            <div className="clock-actions">
              <button
                disabled={action.busy}
                onClick={() =>
                  action.run(() =>
                    repo.clock(match.id, match.clock.startedAt === null ? 'resume' : 'pause'),
                  )
                }
              >
                {match.clock.startedAt === null ? <Play size={15} /> : <Pause size={15} />}{' '}
                {match.clock.startedAt === null ? tr('Reanudar') : tr('Parar')}
              </button>
              <button onClick={() => setConfirm('period')}>{tr('Nuevo tiempo')}</button>
            </div>
          )}
        </div>
        <ExclusionTimers match={match} data={data} now={now} onDialogChange={setCounterDialog} />
        <div className="tabs" role="tablist" aria-label={tr('Vista del partido')}>
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
      </section>
      <ErrorMessage text={action.error} />
      {tab === 'stats' ? (
        <section className="panel">
          <Statistics data={data} matchId={match.id} />
        </section>
      ) : (
        <EventFeed
          data={data}
          match={match}
          events={events}
          pendingOnly={pendingOnly}
          togglePending={() => setPendingOnly(!pendingOnly)}
          onEdit={setEditing}
          onDelete={setConfirm}
        />
      )}
      <div className="capture-bar">
        <button className="primary" onClick={() => setEditing('new')}>
          <Plus size={19} /> {tr('Evento manual')}
        </button>
        <VoiceCapture
          key={match.id}
          data={data}
          match={match}
          allowReview={!editing && !confirm && !counterDialog}
        />
      </div>
      <div className="match-footer">
        {match.status === 'active' && (
          <button className="text-button" onClick={() => setConfirm('finish')}>
            <Flag size={16} /> {tr('Finalizar partido')}
          </button>
        )}
        <button className="text-button danger-text" onClick={() => setConfirm('delete')}>
          <Trash2 size={15} /> {tr('Eliminar partido')}
        </button>
      </div>
      {editing && (
        <EventEditor
          key={editing === 'new' ? 'new' : editing.id}
          data={data}
          match={match}
          event={editing === 'new' ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}{' '}
      {confirm && (
        <MatchConfirmation intent={confirm} match={match} close={() => setConfirm(null)} />
      )}
    </>
  );
}
export { MatchView };
