import { pdfTheme, type PdfContext } from './context';
import { metrics, type Metric } from '../../domain/statistics';
import { metricLabel } from './metric-labels';
export function drawPlayerStatistics(context: PdfContext) {
  const { doc, layout, report, data, t } = context;
  const { room, title, table } = layout;
  const { margin, width } = pdfTheme;
  const nameOf = (metric: Metric) => metricLabel(t, metric);
  const playerCore: Metric[] = [
    'goals',
    'shots',
    'misses',
    'saves',
    'assists',
    'losses',
    'recoveries',
    'exclusions',
  ];
  const short: Partial<Record<Metric, string>> = {
    goals: 'G',
    shots: 'T',
    misses: 'F',
    saves: 'P',
    assists: 'As',
    losses: 'Pe',
    recoveries: 'R',
    exclusions: '2m',
  };
  title(t('Estadísticas por jugador'));
  for (const team of report.teams) {
    const players = data.players
      .filter(
        (player) =>
          player.teamId === team.id &&
          Object.values(report.stats.players[player.id] ?? {}).some(Boolean),
      )
      .sort(
        (a, b) => Number(a.isUnknown) - Number(b.isUnknown) || (a.dorsal ?? 0) - (b.dorsal ?? 0),
      );
    doc.setFont('Handball', 'bold');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(team.name, width);
    room(lines.length * 3.5 + 14);
    doc.text(lines, margin, layout.cursorY + 3);
    layout.cursorY += lines.length * 3.5 + 4;
    if (!players.length) {
      doc.setFont('Handball', 'normal');
      doc.setFontSize(7.5);
      doc.text(t('Sin datos registrados'), margin, layout.cursorY + 2);
      layout.cursorY += 7;
      continue;
    }
    const playerName = (id: string) => {
      const player = data.players.find((player) => player.id === id)!;
      return player.isUnknown ? t('Desconocido') : `#${player.dorsal} ${player.name}`.trim();
    };
    table(
      [t('Jugador'), ...playerCore.map((metric) => short[metric]!)],
      players.map((player) => [
        playerName(player.id),
        ...playerCore.map((metric) => String(report.stats.players[player.id][metric])),
      ]),
      {
        columnStyles: {
          0: {
            cellWidth: 66,
          },
        },
      },
    );
    // Less frequent metrics are listed only when nonzero, preserving a compact table.
    const extra = metrics.filter(
      (metric) =>
        !playerCore.includes(metric) &&
        players.some((player) => report.stats.players[player.id][metric]),
    );
    if (extra.length) {
      table(
        [t('Jugador'), t('Otras estadísticas')],
        players.flatMap((player) => {
          const stats = report.stats.players[player.id];
          const values = extra
            .filter((metric) => stats[metric])
            .map((metric) => `${nameOf(metric)}: ${stats[metric]}`);
          return values.length ? [[playerName(player.id), values.join(' · ')]] : [];
        }),
        {
          columnStyles: {
            0: {
              cellWidth: 66,
            },
          },
        },
      );
    }
  }
  doc.setFont('Handball', 'normal');
  doc.setFontSize(6.5);
  room(10);
  const legend = playerCore.map((metric) => `${short[metric]}: ${nameOf(metric)}`).join(' · ');
  const legendLines = doc.splitTextToSize(legend, width);
  room(legendLines.length * 3 + 3);
  doc.text(legendLines, margin, layout.cursorY);
  layout.cursorY += legendLines.length * 3 + 3;
}
