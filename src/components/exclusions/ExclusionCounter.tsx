import { Pause, Play, X } from 'lucide-react';
import type { Match, Snapshot } from '../../domain/schema';
import { exclusionRemaining, type ExclusionTimer } from '../../domain/exclusions';
import { tr } from '../../i18n';

export function ExclusionCounter({
  timer,
  slot,
  match,
  data,
  now,
  busy,
  toggle,
  clear,
}: {
  timer: ExclusionTimer;
  slot: number;
  match: Match;
  data: Snapshot;
  now: number;
  busy: boolean;
  toggle: () => void;
  clear: () => void;
}) {
  const seconds = Math.ceil(exclusionRemaining(timer, now) / 1000);
  const finished = seconds === 0;
  const teamName = data.teams.find((team) => team.id === timer.teamId)?.name ?? '';
  const stateLabel = tr(
    finished
      ? 'Puede volver'
      : !timer.running || match.clock.startedAt === null
        ? 'Pausado'
        : 'En juego',
  );
  const timeLabel =
    String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  return (
    <div
      className={`exclusion-timer ${finished ? 'expired' : ''}`}
      role="group"
      aria-label={tr('Exclusión {number}', { number: slot + 1 })}
    >
      <button
        className="timer-toggle"
        disabled={busy || match.status === 'done'}
        aria-label={tr(finished ? 'Liberar' : timer.running ? 'Parar' : 'Reanudar')}
        aria-description={[
          teamName,
          timer.dorsal === null ? tr('Sin identificar') : '#' + timer.dorsal,
          stateLabel,
          timeLabel,
        ].join(' · ')}
        title={teamName}
        onClick={toggle}
      >
        <span className="timer-meta">
          <span className="timer-player">
            {timer.teamId === match.localTeamId ? '1' : '2'} ·{' '}
            {timer.dorsal === null ? '—' : '#' + timer.dorsal}
          </span>
          <span className="timer-state" role="status">
            {stateLabel}
          </span>
        </span>
        <span className="timer-time">
          <strong className="timer-digits">{timeLabel}</strong>
          {!finished && (timer.running ? <Pause size={20} /> : <Play size={20} />)}
        </span>
      </button>
      {!finished && (
        <button
          className="timer-clear"
          disabled={busy || match.status === 'done'}
          aria-label={tr('Liberar')}
          onClick={clear}
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
