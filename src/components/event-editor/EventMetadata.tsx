import { definitions, type EventType, type GameEvent } from '../../domain/model';
import { tr } from '../../i18n';
import { WheelPicker } from '../WheelPicker';

type Metadata = GameEvent['metadata'];
type Infraction = NonNullable<Metadata['infraction']>;
const infractionTypes: readonly Infraction[] = ['Pasos', 'Dobles', 'Pisando'];

export function EventMetadata({
  type,
  metadata,
  change,
}: {
  type: EventType | null;
  metadata: Metadata;
  change: (metadata: Metadata) => void;
}) {
  const penaltyAllowed = type !== null && Boolean(definitions[type].penalty);
  const blueAllowed = type === 'disqualification';

  return (
    <div className="metadata">
      <div className="metadata-flags">
        <label className={!penaltyAllowed ? 'disabled' : ''}>
          <span>{tr('Penalti (7 m)')}</span>
          <input
            type="checkbox"
            disabled={!penaltyAllowed}
            checked={!!metadata.penalty && penaltyAllowed}
            onChange={(event) => change({ ...metadata, penalty: event.target.checked })}
          />
        </label>
        <label className={!blueAllowed ? 'disabled' : ''}>
          <span>{tr('Tarjeta azul')}</span>
          <input
            type="checkbox"
            disabled={!blueAllowed}
            checked={!!metadata.blue && blueAllowed}
            onChange={(event) => change({ ...metadata, blue: event.target.checked })}
          />
        </label>
      </div>
      {type === 'infraction' && (
        <WheelPicker<Infraction | ''>
          label={tr('Tipo de infracción')}
          value={metadata.infraction ?? ''}
          options={[
            { value: '', label: tr('Sin indicar') },
            ...infractionTypes.map((value) => ({ value, label: tr(value) })),
          ]}
          change={(infraction) => change({ ...metadata, infraction: infraction || undefined })}
        />
      )}
    </div>
  );
}
