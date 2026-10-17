import type { PeriodTimeline } from '../../domain/report';
import { pdfTheme, type PdfContext } from './context';

export function drawPeriodChart(
  context: PdfContext,
  period: PeriodTimeline,
  left: number,
  top: number,
) {
  const { doc, t } = context;
  const { ink, yellow } = pdfTheme;
  const chartWidth = 90;
  const chartHeight = 48;
  const plotX = left + 8;
  const plotY = top + 8;
  const plotWidth = chartWidth - 11;
  const plotHeight = chartHeight - 14;
  const maxGoals = Math.max(5, Math.ceil(Math.max(...period.end) / 5) * 5);
  const minuteX = (minute: number) => plotX + (minute / period.maxMinute) * plotWidth;
  const goalsY = (goals: number) => plotY + plotHeight - (goals / maxGoals) * plotHeight;
  doc.setFont('Handball', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ink);
  doc.text(
    `${t('Tiempo')} ${period.period}  (${period.start.join('-')} / ${period.end.join('-')})`,
    left,
    top + 3,
  );
  doc.setFont('Handball', 'normal');
  doc.setFontSize(6);
  for (let i = 0; i <= 5; i++) {
    doc.setDrawColor(220);
    doc.setLineWidth(0.15);
    doc.line(plotX, goalsY((maxGoals * i) / 5), plotX + plotWidth, goalsY((maxGoals * i) / 5));
    doc.setTextColor(70);
    doc.text(String((maxGoals * i) / 5), plotX - 2, goalsY((maxGoals * i) / 5) + 1, {
      align: 'right',
    });
    doc.text(
      String((period.maxMinute * i) / 5),
      minuteX((period.maxMinute * i) / 5),
      plotY + plotHeight + 3,
      {
        align: 'center',
      },
    );
  }
  doc.text(t('Goles'), left, top + 6.5);
  doc.text(t('Minutos'), left + chartWidth, top + chartHeight, { align: 'right' });
  period.series.forEach((points, index) => {
    const draw = (color: [number, number, number], lineWidth: number) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(lineWidth);
      doc.setLineDashPattern(index ? [1.4, 0.8] : [], 0);
      for (let i = 1; i < points.length; i++) {
        doc.line(
          minuteX(points[i - 1].minute),
          goalsY(points[i - 1].goals),
          minuteX(points[i].minute),
          goalsY(points[i].goals),
        );
      }
    };
    if (!index) {
      draw([125, 105, 0], 0.75);
    }
    draw(index ? ink : yellow, 0.4);
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(...ink);
    doc.setFillColor(...(index ? ink : yellow));
    doc.setLineWidth(0.15);
    for (const point of points.filter((point) => point.goal)) {
      doc.circle(minuteX(point.minute), goalsY(point.goals), 0.6, 'FD');
    }
  });
}
