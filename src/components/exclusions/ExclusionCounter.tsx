import { Pause, Play, Plus, X } from 'lucide-react';
import type { Match, Snapshot } from '../../domain/schema';
import {
  exclusionRemaining,
  EXCLUSION_DURATION_MS,
  type ExclusionTimer,
} from '../../domain/exclusions';
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
  timer: ExclusionTimer | null;
  slot: number;
  match: Match;
  data: Snapshot;
  now: number;
  busy: boolean;
  toggle: () => void;
  clear: () => void;
}) {
  const remaining = timer ? exclusionRemaining(timer, now) : EXCLUSION_DURATION_MS;
  const seconds = Math.ceil(remaining / 1000);
  const finished = Boolean(timer && remaining === 0);
  return (
    <div
      className={`exclusion-timer ${finished ? 'expired' : ''} ${!timer ? 'empty' : ''}`}
      role="group"
      aria-label={tr('Exclusión {number}', { number: slot + 1 })}
    >
      <button
        className="timer-toggle"
        disabled={busy || match.status === 'done'}
        aria-label={tr(
          !timer ? 'Activar' : finished ? 'Liberar' : timer.running ? 'Parar' : 'Reanudar',
        )}
        title={timer ? data.teams.find((t) => t.id === timer.teamId)?.name : tr('Activar')}
        onClick={toggle}
      >
        <span className="timer-meta">
          <span className="timer-player">
            {timer ? (
              `${timer.teamId === match.localTeamId ? '1' : '2'} · ${timer.dorsal === null ? '—' : '#' + timer.dorsal}`
            ) : (
              <>
                <Plus size={20} />
                {tr('Libre')} {slot + 1}
              </>
            )}
          </span>
          {timer && (
            <span className="timer-state" role="status">
              {finished
                ? tr('Puede volver')
                : !timer.running || match.clock.startedAt === null
                  ? tr('Pausado')
                  : tr('En juego')}
            </span>
          )}
        </span>
        {timer && (
          <>
            <span className="timer-time">
              <strong className="timer-digits">
                {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                {String(seconds % 60).padStart(2, '0')}
              </strong>
              {!finished &&
                (timer.running && match.clock.startedAt !== null ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} />
                ))}
            </span>
          </>
        )}
      </button>
      {timer && !finished && (
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
