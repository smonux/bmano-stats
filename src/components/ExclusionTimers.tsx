import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, Volume2, X } from 'lucide-react';
import type { Match, Snapshot } from '../domain/model';
import { exclusionRemaining } from '../domain/exclusions';
import { repo } from '../data/database';
import { tr } from '../i18n';
import { Confirm, ErrorMessage, Modal, useAction } from './ui';
import { WheelPicker } from './WheelPicker';
import { useExclusionSound } from './exclusions/useExclusionSound';
export function ExclusionTimers({
  match,
  data,
  now,
  onDialogChange,
}: {
  match: Match;
  data: Snapshot;
  now: number;
  onDialogChange: (open: boolean) => void;
}) {
  const timers = match.exclusions ?? [null, null, null];
  const [editing, setEditing] = useState<number | null>(null);
  const [clearing, setClearing] = useState<number | null>(null);
  const [teamId, setTeam] = useState(match.localTeamId);
  const [dorsal, setDorsal] = useState('');
  const sound = useExclusionSound();
  const announced = useRef(new Set<string>());
  const action = useAction();
  useEffect(() => {
    onDialogChange(editing !== null || clearing !== null);
    return () => onDialogChange(false);
  }, [editing, clearing, onDialogChange]);
  useEffect(() => {
    for (const timer of timers) {
      if (timer && exclusionRemaining(timer, now) === 0 && !announced.current.has(timer.id)) {
        if (sound.notify()) {
          announced.current.add(timer.id);
        }
      }
    }
  }, [timers, now, sound.notify]);
  return (
    <section className="exclusions" aria-label={tr('Cuenta atrás de exclusiones')}>
      <div className="exclusion-heading">
        <h2>{tr('Exclusiones (2 min)')}</h2>
        <button className="text-button" aria-pressed={sound.enabled} onClick={sound.toggle}>
          <Volume2 size={16} />
          {tr(sound.enabled ? 'Sonido activado' : 'Aviso sonoro')}
        </button>
      </div>
      <div className="exclusion-grid">
        {timers.map((timer, i) => {
          const remaining = timer ? exclusionRemaining(timer, now) : 120000;
          const seconds = Math.ceil(remaining / 1000);
          const finished = Boolean(timer && remaining === 0);
          return (
            <div
              className={`exclusion-timer ${finished ? 'expired' : ''}`}
              key={i}
              role="group"
              aria-label={tr('Exclusión {number}', { number: i + 1 })}
            >
              <button
                className="timer-toggle"
                disabled={action.busy || match.status === 'done'}
                aria-label={tr(
                  !timer ? 'Activar' : finished ? 'Liberar' : timer.running ? 'Parar' : 'Reanudar',
                )}
                title={timer ? data.teams.find((t) => t.id === timer.teamId)?.name : tr('Activar')}
                onClick={() => {
                  if (!timer) {
                    setEditing(i);
                    setDorsal('');
                    setTeam(match.localTeamId);
                  } else if (finished) {
                    action.run(() => repo.exclusion(match.id, i, 'clear'));
                  } else {
                    action.run(() =>
                      repo.exclusion(match.id, i, timer.running ? 'pause' : 'resume'),
                    );
                  }
                }}
              >
                <span className="timer-player">
                  {timer ? (
                    `${timer.teamId === match.localTeamId ? '1' : '2'} · ${timer.dorsal === null ? '—' : '#' + timer.dorsal}`
                  ) : (
                    <>
                      <Plus size={13} />
                      {tr('Libre')} {i + 1}
                    </>
                  )}
                </span>
                <span className="timer-time">
                  <strong className="timer-digits">
                    {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                    {String(seconds % 60).padStart(2, '0')}
                  </strong>
                  {timer &&
                    !finished &&
                    (timer.running && match.clock.startedAt !== null ? (
                      <Pause size={10} />
                    ) : (
                      <Play size={10} />
                    ))}
                </span>
                <span className="timer-state" role="status">
                  {finished
                    ? tr('Puede volver')
                    : timer && (!timer.running || match.clock.startedAt === null)
                      ? tr('Pausado')
                      : '\u00a0'}
                </span>
              </button>
              {timer && !finished && (
                <button
                  className="timer-clear"
                  disabled={action.busy || match.status === 'done'}
                  aria-label={tr('Liberar')}
                  onClick={() => setClearing(i)}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="sr-only">
        {tr(
          'Sigue el reloj del partido. Mantén la aplicación abierta para recibir avisos. Registra la exclusión como evento aparte.',
        )}
      </p>
      <ErrorMessage text={action.error || sound.error} />
      {editing !== null && (
        <Modal
          title={tr('Exclusión {number}', { number: editing + 1 })}
          close={() => !action.busy && setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run(async () => {
                await repo.exclusion(match.id, editing, 'start', {
                  teamId,
                  dorsal: dorsal === '' ? null : Number(dorsal),
                });
                setEditing(null);
              });
            }}
          >
            <WheelPicker
              label={tr('Equipo')}
              value={teamId}
              options={[match.localTeamId, match.visitorTeamId].map((id) => ({
                value: id,
                label: data.teams.find((team) => team.id === id)?.name ?? '',
              }))}
              change={setTeam}
            />
            <label>
              {tr('Dorsal (opcional)')}
              <input
                aria-label={tr('Dorsal (opcional)')}
                autoFocus
                inputMode="numeric"
                pattern="[0-9]{1,2}"
                maxLength={2}
                value={dorsal}
                onChange={(e) => setDorsal(e.target.value.replace(/\D/g, ''))}
              />
            </label>
            <ErrorMessage text={action.error} />
            <button className="primary full" disabled={action.busy}>
              {tr('Activar')} · 02:00
            </button>
          </form>
        </Modal>
      )}
      {clearing !== null && (
        <Confirm
          title={tr('Liberar contador')}
          text={tr('Se borrará este contador. La estadística de exclusión no cambia.')}
          close={() => setClearing(null)}
          confirm={() => repo.exclusion(match.id, clearing, 'clear')}
        />
      )}
    </section>
  );
}
