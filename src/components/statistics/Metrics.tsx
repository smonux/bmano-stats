import { tr } from '../../i18n';
import { efficacy, labels, type Metric, type Stats } from '../../domain/statistics';
const rows: Metric[] = [
  'losses',
  'recoveries',
  'exclusions',
  'infractions',
  'passives',
  'substitutions',
];
export function Metrics({ stats, player = false }: { stats: Stats; player?: boolean }) {
  return (
    <>
      <div className="metrics">
        <div>
          <span>{tr('Goles')}</span>
          <strong>{stats.goals}</strong>
        </div>
        <div>
          <span>{tr('Fallados')}</span>
          <strong>{stats.misses}</strong>
        </div>
        <div>
          <span>{tr('Eficacia de tiro')}</span>
          <strong>{efficacy(stats)}</strong>
        </div>
        <div>
          <span>{tr('Paradas')}</span>
          <strong>{stats.saves}</strong>
        </div>
      </div>
      <dl className="stat-list">
        {[
          ...rows.filter((metric) => !player || !['passives', 'substitutions'].includes(metric)),
          ...(player
            ? (['forcedExclusions', 'assists', 'substitutionsOut', 'substitutionsIn'] as Metric[])
            : []),
        ].map((metric) => (
          <div key={metric}>
            <dt>{tr(labels[metric] ?? metric)}</dt>
            <dd>{stats[metric]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
