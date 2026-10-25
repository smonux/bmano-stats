import { ShirtNumberPicker } from './ShirtNumberPicker';
import { useEffect, useRef, useState } from 'react';
import { Plus, Volume2 } from 'lucide-react';
import type { Match, Snapshot } from '../domain/model';
import { exclusionRemaining } from '../domain/exclusions';
import { repo } from '../data/database';
import { tr } from '../i18n';
import { Confirm, ErrorMessage, Modal, useAction } from './ui';
import { WheelPicker } from './WheelPicker';
import { ExclusionCounter } from './exclusions/ExclusionCounter';
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
  const freeSlot = timers.findIndex((timer) => timer === null);
  const activeCount = timers.filter(Boolean).length;
  function startCounter(slot: number) {
    setEditing(slot);
    setDorsal('');
    setTeam(match.localTeamId);
  }
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
    <section
      className="exclusions"
      id={`match-exclusions-${match.id}`}
      tabIndex={-1}
      aria-label={tr('Cuenta atrás de exclusiones')}
    >
      <div className="exclusion-heading">
        <h2>
          {tr('Exclusiones (2 min)')} <span className="caption">{activeCount}/3</span>
        </h2>
        <button className="text-button" aria-pressed={sound.enabled} onClick={sound.toggle}>
          <Volume2 size={16} />
          {tr(sound.enabled ? 'Sonido activado' : 'Aviso sonoro')}
        </button>
      </div>
      <div className="exclusion-grid">
        {timers.map(
          (timer, slot) =>
            timer && (
              <ExclusionCounter
                key={slot}
                timer={timer}
                slot={slot}
                match={match}
                data={data}
                now={now}
                busy={action.busy}
                clear={() => setClearing(slot)}
                toggle={() => {
                  if (exclusionRemaining(timer, now) === 0) {
                    action.run(() => repo.exclusion(match.id, slot, 'clear'));
                  } else {
                    action.run(() =>
                      repo.exclusion(match.id, slot, timer.running ? 'pause' : 'resume'),
                    );
                  }
                }}
              />
            ),
        )}
      </div>
      {freeSlot !== -1 && (
        <button
          className="start-exclusion"
          disabled={match.status === 'done' || action.busy}
          onClick={() => startCounter(freeSlot)}
        >
          <Plus size={20} />
          {tr('Iniciar contador')}
        </button>
      )}
      <details className="counter-help" aria-label={tr('Cómo funcionan los contadores')}>
        <summary>{tr('El contador no añade una exclusión al registro.')}</summary>
        <p className="caption">
          {tr(
            'Sigue el reloj del partido. Mantén la aplicación abierta para recibir avisos. Registra la exclusión como evento aparte.',
          )}
        </p>
      </details>
      <ErrorMessage text={action.error || sound.error} />
      {editing !== null && (
        <Modal
          title={tr('Exclusión {number}', {
            number: editing + 1,
          })}
          close={() => !action.busy && setEditing(null)}
        >
          <form
            onSubmit={(inputEvent) => {
              inputEvent.preventDefault();
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
            <ShirtNumberPicker label={tr('Dorsal (opcional)')} value={dorsal} change={setDorsal} />
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
