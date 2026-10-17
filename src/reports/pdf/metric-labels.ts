import { labels, type Metric } from '../../domain/statistics';
import type { Translate } from './context';

export function metricLabel(t: Translate, metric: Metric) {
  const metricNames: Partial<Record<Metric, string>> = {
    shots: 'Tiros',
    goalsReceived: 'Goles recibidos',
    shotsReceived: 'Tiros recibidos',
    penaltiesReceived: 'Penaltis recibidos',
    blue: 'Azules',
    penaltyGoals: 'Goles de 7 m',
    penaltyMisses: 'Fallos de 7 m',
    penaltySaves: 'Paradas de 7 m',
  };
  return t(metricNames[metric] ?? labels[metric] ?? metric);
}
