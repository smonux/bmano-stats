import { DialogForm } from './ui/DialogForm';
import { ShirtNumberPicker } from './ShirtNumberPicker';
import { useId, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, Volume2, VolumeX } from 'lucide-react';
import type { Match, Snapshot } from '../domain/model';
import { exclusionRemaining, EXCLUSION_SLOT_COUNT } from '../domain/exclusions';
import { repo } from '../data/database';
import { tr } from '../i18n';
import { Confirm, ErrorMessage, Modal, useAction } from './ui';
import { WheelPicker } from './WheelPicker';
import { ExclusionCounter } from './exclusions/ExclusionCounter';
import { useExclusionSound } from './exclusions/useExclusionSound';
export type CounterPrefill = { eventId: string; teamId: string; dorsal: string };
export function ExclusionTimers({
  match,
  data,
  now,
  onDialogChange,
  prefill,
  onPrefillHandled,
  onPrefillStarted,
  periodAction,
}: {
  match: Match;
  data: Snapshot;
  now: number;
  onDialogChange: (open: boolean) => void;
  prefill?: CounterPrefill | null;
  onPrefillHandled?: () => void;
  onPrefillStarted?: (eventId: string) => void;
  periodAction?: ReactNode;
}) {
  const errorId = useId();
  const timers = match.exclusions ?? Array(EXCLUSION_SLOT_COUNT).fill(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [clearing, setClearing] = useState<number | null>(null);
  const [teamId, setTeam] = useState(match.localTeamId);
  const [dorsal, setDorsal] = useState('');
  const [sourceEvent, setSourceEvent] = useState<string | null>(null);
  const sound = useExclusionSound();
  const announced = useRef(new Set<string>());
  const action = useAction();
  const freeSlot = timers.findIndex((timer) => timer === null);
  function startCounter(slot: number) {
    setSourceEvent(null);
    setEditing(slot);
    setDorsal('');
    setTeam(match.localTeamId);
  }
  useEffect(() => {
    if (!prefill) return;
    onPrefillHandled?.();
    if (freeSlot < 0 || match.status !== 'active') {
      action.setError(
        tr('Los cuatro contadores están ocupados. Libera uno antes de activar otro.'),
      );
      onDialogChange(false);
      return;
    }
    action.setError('');
    setSourceEvent(prefill.eventId);
    setTeam(prefill.teamId);
    setDorsal(prefill.dorsal);
    setEditing(freeSlot);
  }, [prefill, freeSlot, match.status, onPrefillHandled, onDialogChange]);
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
      <div className="exclusion-heading counter-toolbar">
        {periodAction}
        {freeSlot !== -1 && (
          <button
            className="start-exclusion"
            aria-label={tr('Iniciar contador')}
            disabled={match.status === 'done' || action.busy}
            onClick={() => startCounter(freeSlot)}
          >
            <Plus size={20} />
            {tr('2 min')}
          </button>
        )}
        <button
          className="counter-sound"
          aria-label={tr(sound.enabled ? 'Sonido activado' : 'Aviso sonoro')}
          title={tr(sound.enabled ? 'Sonido activado' : 'Aviso sonoro')}
          aria-pressed={sound.enabled}
          onClick={sound.toggle}
        >
          {sound.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
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
              />
            ),
        )}
      </div>
      <ErrorMessage text={action.error || sound.error} />
      {editing !== null && (
        <Modal
          className="form-dialog"
          title={tr('Exclusión {number}', {
            number: editing + 1,
          })}
          close={() => !action.busy && setEditing(null)}
        >
          <DialogForm
            error={action.error}
            errorId={errorId}
            busy={action.busy}
            actions={
              <>
                <button type="button" disabled={action.busy} onClick={() => setEditing(null)}>
                  {tr('Cancelar')}
                </button>
                <button className="primary" disabled={action.busy}>
                  {tr('Activar')} · 02:00
                </button>
              </>
            }
            onSubmit={(inputEvent) => {
              inputEvent.preventDefault();
              action.run(async () => {
                await repo.exclusion(match.id, editing, 'start', {
                  teamId,
                  dorsal: dorsal === '' ? null : Number(dorsal),
                });
                if (sourceEvent) onPrefillStarted?.(sourceEvent);
                setEditing(null);
              });
            }}
          >
            {sourceEvent && (
              <p className="caption">
                {tr(
                  'Activa el contador cuando empiece la exclusión. Editar o borrar la jugada no cambia el contador, y liberarlo no borra la jugada.',
                )}
              </p>
            )}
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
          </DialogForm>
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
