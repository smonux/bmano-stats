import { useState } from 'react';
import { ShirtNumberPicker } from '../ShirtNumberPicker';
import type { Player } from '../../domain/model';
import { tr } from '../../i18n';
import { ChoiceGroup } from './ChoiceGroup';

export function ParticipantPicker({
  role,
  participantLabel,
  teamId,
  teamName,
  players,
  shirtNumber,
  change,
}: {
  role: 'primary' | 'related';
  participantLabel: string;
  teamId: string;
  teamName: string;
  players: readonly Player[];
  shirtNumber: string;
  change: (shirtNumber: string) => void;
}) {
  const knownPlayers = players
    .filter((player) => player.teamId === teamId && !player.isUnknown && !player.deletedAt)
    .sort((a, b) => a.dorsal! - b.dorsal!);
  const selected = knownPlayers.find(
    (player) => shirtNumber !== '' && player.dorsal === Number(shirtNumber),
  );
  const [other, setOther] = useState(shirtNumber !== '' && !selected);
  const label = role === 'primary' ? tr('Jugador principal') : tr('Jugador relacionado');
  return (
    <section className="participant" aria-label={`${participantLabel} · ${teamName}`}>
      <p className="participant-team">
        <strong>{participantLabel}</strong> · {teamName}
      </p>
      <ChoiceGroup
        label={label}
        className="player-choices"
        value={
          other ? 'other' : selected ? String(selected.dorsal) : shirtNumber === '' ? '' : 'other'
        }
        options={[
          ...knownPlayers.map((player) => ({
            value: String(player.dorsal),
            label: `#${player.dorsal} ${player.name || tr('Sin nombre')}`,
            accessibleLabel: `#${player.dorsal} ${player.name || tr('Sin nombre')}`,
            content: (
              <>
                <strong className="player-dorsal">{player.dorsal}</strong>
                <span className="player-short-name" title={player.name}>
                  {player.name || tr('Sin nombre')}
                </span>
              </>
            ),
          })),
          { value: '', label: tr('Sin identificar') },
          { value: 'other', label: tr('Otro dorsal') },
        ]}
        change={(value) => {
          setOther(value === 'other');
          if (value !== 'other') change(value);
        }}
      />
      {other && (
        <ShirtNumberPicker
          label={role === 'primary' ? tr('Dorsal principal') : tr('Dorsal relacionado')}
          value={shirtNumber}
          change={change}
        />
      )}
      <p className="caption participant-selection">
        {shirtNumber === ''
          ? tr('Sin identificar')
          : `#${Number(shirtNumber)} · ${selected?.name || tr('Sin nombre')}`}
      </p>
    </section>
  );
}
