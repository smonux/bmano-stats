import { type PdfContext } from './context';
import { emptyStats, efficacy, metrics, type Metric } from '../../domain/statistics';
import { metricLabel } from './metric-labels';

export function drawTeamStatistics(context: PdfContext) {
  const { layout, report, t } = context;
  const { title, table } = layout;
  const nameOf = (metric: Metric) => metricLabel(t, metric);
  title(t('Estadísticas por equipo'));
  const totals = report.teams.map((team) => report.stats.teams[team.id] ?? emptyStats());
  const core: Metric[] = [
    'goals',
    'shots',
    'misses',
    'saves',
    'goalsReceived',
    'shotsReceived',
    'losses',
    'recoveries',
  ];
  const shown = metrics.filter(
    (metric) => core.includes(metric) || totals.some((stats) => stats[metric]),
  );
  const pairs = shown.map((metric) => [
    nameOf(metric),
    String(totals[0][metric]),
    String(totals[1][metric]),
  ]);
  pairs.push([t('Eficacia de tiro'), efficacy(totals[0]), efficacy(totals[1])]);
  const middle = Math.ceil(pairs.length / 2);
  const rows = Array.from({ length: middle }, (_, i) => [
    ...pairs[i],
    ...(pairs[i + middle] ?? ['', '', '']),
  ]);
  table([t('Estadísticas'), '1', '2', t('Estadísticas'), '1', '2'], rows, {
    columnStyles: {
      0: { cellWidth: 64 },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 64 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
    },
  });
}
