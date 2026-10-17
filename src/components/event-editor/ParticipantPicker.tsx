import { useId } from 'react';
import type { Player } from '../../domain/model';
import { tr } from '../../i18n';
import { WheelPicker, type WheelOption } from '../WheelPicker';

export function ParticipantPicker({
  role,
  participantLabel,
  teamId,
  teamName,
  players,
  shirtNumber,
  disabled,
  change,
}: {
  role: 'primary' | 'related';
  participantLabel: string;
  teamId: string | null;
  teamName: string;
  players: readonly Player[];
  shirtNumber: string;
  disabled: boolean;
  change: (shirtNumber: string) => void;
}) {
  const inputId = useId();
  const knownPlayers = players
    .filter((player) => player.teamId === teamId && !player.isUnknown && !player.deletedAt)
    .sort((first, second) => first.dorsal! - second.dorsal!);
  const selectedPlayer = knownPlayers.find(
    (player) => shirtNumber !== '' && player.dorsal === Number(shirtNumber),
  );
  const selectedNumber = shirtNumber === '' ? '' : String(Number(shirtNumber));
  const numberedOptions: WheelOption[] = knownPlayers.map((player) => ({
    value: String(player.dorsal),
    label: `#${player.dorsal} ${player.name}`.trim(),
  }));
  // A new or voice-recognised number must stay selected even before it is in the roster.
  if (shirtNumber !== '' && !selectedPlayer) {
    numberedOptions.push({
      value: selectedNumber,
      label: `#${selectedNumber} · ${tr('Dorsal nuevo')}`,
    });
  }
  const options = [
    { value: '', label: tr('Desconocido') },
    ...numberedOptions.sort((first, second) => Number(first.value) - Number(second.value)),
  ];

  let hint = tr('Sin dorsal: se atribuye a Desconocido cuando corresponda.');
  if (disabled) {
    hint = tr('No aplicable');
  } else if (shirtNumber !== '') {
    hint =
      selectedPlayer?.name ||
      tr('Dorsal {number} válido · nombre opcional', {
        number: Number(shirtNumber),
      });
  }

  return (
    <fieldset disabled={disabled} className="participant">
      <legend>
        {role === 'primary' ? tr('Principal') : tr('Relacionado')} · {participantLabel}
      </legend>
      <div className="participant-row">
        <div className="participant-number">
          <span className="participant-team">{teamName || tr('Sin equipo')}</span>
          <label className="sr-only" htmlFor={inputId}>
            {role === 'primary' ? tr('Dorsal principal') : tr('Dorsal relacionado')}
          </label>
          <input
            id={inputId}
            inputMode="numeric"
            pattern="[0-9]{1,2}"
            maxLength={2}
            placeholder="Nº"
            value={shirtNumber}
            onChange={(event) => change(event.target.value.replace(/\D/g, '').slice(0, 2))}
          />
        </div>
        <WheelPicker
          label={role === 'primary' ? tr('Jugador principal') : tr('Jugador relacionado')}
          hideLabel
          value={selectedNumber}
          options={options}
          disabled={disabled}
          change={change}
        />
      </div>
      <small>{hint}</small>
    </fieldset>
  );
}
