import { pdfTheme, type PdfContext } from './context';

export function drawHeader(context: PdfContext) {
  const { doc, layout, report, language, t } = context;
  const { ink, yellow, margin } = pdfTheme;
  doc.setFillColor(...yellow);
  doc.rect(0, 0, 210, 3, 'F');
  doc.setFillColor(...ink);
  doc.rect(0, 3, 210, 10, 'F');
  doc.setTextColor(255);
  doc.setFont('Handball', 'bold');
  doc.setFontSize(9);
  doc.text('handballstats', margin, 9.5);
  doc.setTextColor(...ink);
  doc.setFont('Handball', 'normal');
  doc.setFontSize(8);
  doc.text(
    `${report.match.date}  |  ${t(report.match.status === 'active' ? 'En curso' : 'Finalizado')}`,
    margin,
    21,
  );
  doc.setFontSize(6);
  doc.setTextColor(90);
  doc.text(t('EQUIPO 1 · NOSOTROS'), margin, 25);
  doc.text(t('EQUIPO 2 · RIVAL'), 198, 25, { align: 'right' });
  doc.setTextColor(...ink);
  doc.setFont('Handball', 'bold');
  doc.setFontSize(11);
  const names = report.teams.map((team) => doc.splitTextToSize(team.name, 65) as string[]);
  doc.text(names[0], margin, 29);
  doc.text(names[1], 198, 29, { align: 'right' });
  doc.setFontSize(28);
  const scoreText = report.teams.map((team) => report.stats.teams[team.id]?.goals ?? 0).join(' : ');
  doc.setFontSize(Math.min(28, (28 * 44) / doc.getTextWidth(scoreText)));
  doc.text(scoreText, 105, 36, { align: 'center' });
  layout.cursorY = Math.max(44, 29 + Math.max(...names.map((lines) => lines.length)) * 4.5);
  doc.setFont('Handball', 'normal');
  doc.setFontSize(7);
  doc.text(
    t('Generado: {date}', { date: new Date(report.generatedAt).toLocaleString(language) }),
    margin,
    layout.cursorY,
  );
  layout.cursorY += 5;
}
