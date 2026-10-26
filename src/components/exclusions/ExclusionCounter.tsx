import { X } from 'lucide-react';
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
  clear,
}: {
  timer: ExclusionTimer;
  slot: number;
  match: Match;
  data: Snapshot;
  now: number;
  busy: boolean;
  clear: () => void;
}) {
  const seconds = Math.ceil(exclusionRemaining(timer, now) / 1000);
  const finished = seconds === 0;
  const teamName = data.teams.find((team) => team.id === timer.teamId)?.name ?? '';
  const timeLabel =
    String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  return (
    <div
      className={`exclusion-timer ${finished ? 'expired' : ''}`}
      role="group"
      aria-label={tr('Exclusión {number}', { number: slot + 1 })}
      aria-description={[
        teamName,
        timer.dorsal === null ? tr('Sin identificar') : '#' + timer.dorsal,
        tr(finished ? 'Puede volver' : match.clock.startedAt === null ? 'Pausado' : 'En juego'),
        timeLabel,
      ].join(' · ')}
    >
      <div className="timer-reading" title={teamName}>
        <span className="timer-player">
          {timer.teamId === match.localTeamId ? '1' : '2'} ·{' '}
          {timer.dorsal === null ? '—' : '#' + timer.dorsal}
        </span>
        <strong className="timer-digits">{timeLabel}</strong>
        {finished && (
          <span className="timer-state" role="status">
            {tr('Puede volver')}
          </span>
        )}
      </div>
      <button
        className="timer-clear"
        disabled={busy || match.status === 'done'}
        aria-label={tr('Liberar')}
        onClick={clear}
      >
        <X size={20} />
      </button>
    </div>
  );
}
