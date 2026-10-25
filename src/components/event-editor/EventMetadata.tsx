import { definitions, type EventType, type GameEvent } from '../../domain/model';
import { tr } from '../../i18n';
import { ChoiceGroup } from './ChoiceGroup';

type Metadata = GameEvent['metadata'];
const infractionTypes = ['Pasos', 'Dobles', 'Pisando'] as const;

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
  if (!penaltyAllowed && type !== 'disqualification' && type !== 'infraction') return null;
  return (
    <div className="metadata">
      <div className="metadata-flags">
        {penaltyAllowed && (
          <label>
            <span>{tr('Penalti (7 m)')}</span>
            <input
              type="checkbox"
              checked={!!metadata.penalty}
              onChange={(event) => change({ ...metadata, penalty: event.target.checked })}
            />
          </label>
        )}
        {type === 'disqualification' && (
          <label>
            <span>{tr('Tarjeta azul')}</span>
            <input
              type="checkbox"
              checked={!!metadata.blue}
              onChange={(event) => change({ ...metadata, blue: event.target.checked })}
            />
          </label>
        )}
      </div>
      {type === 'infraction' && (
        <ChoiceGroup
          label={tr('Tipo de infracción')}
          value={metadata.infraction ?? ''}
          options={[
            { value: '', label: tr('Sin indicar') },
            ...infractionTypes.map((value) => ({ value, label: tr(value) })),
          ]}
          change={(value) =>
            change({ ...metadata, infraction: (value as Metadata['infraction']) || undefined })
          }
        />
      )}
    </div>
  );
}
