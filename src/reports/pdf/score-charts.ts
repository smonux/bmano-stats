import { pdfTheme, type PdfContext } from './context';
import { drawPeriodChart } from './period-chart';

export function drawScoreCharts(context: PdfContext) {
  const { doc, layout, report, t } = context;
  const { room, title } = layout;
  const { margin, width } = pdfTheme;
  title(t('Evolución del marcador'));
  doc.setFont('Handball', 'normal');
  doc.setFontSize(7);
  doc.text(
    t('Marcador acumulado. Cada escalón corresponde a un gol en su minuto.'),
    margin,
    layout.cursorY,
  );
  layout.cursorY += 5;
  for (let i = 0; i < report.periods.length; i += 2) {
    room(58);
    drawPeriodChart(context, report.periods[i], margin, layout.cursorY);
    if (report.periods[i + 1]) {
      drawPeriodChart(context, report.periods[i + 1], margin + 96, layout.cursorY);
    }
    layout.cursorY += 54;
  }
  doc.setFontSize(7);
  doc.setFont('Handball', 'normal');
  room(12);
  const chartLegend = report.teams
    .map(
      (team, i) =>
        `${i + 1}: ${team.name} (${t(i ? 'línea negra discontinua' : 'línea amarilla')})`,
    )
    .join(' · ');
  const chartLegendLines = doc.splitTextToSize(chartLegend, width);
  room(chartLegendLines.length * 3.3 + 3);
  doc.text(chartLegendLines, margin, layout.cursorY);
  layout.cursorY += chartLegendLines.length * 3.3 + 3;
}
