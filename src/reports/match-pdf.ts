import { jsPDF } from 'jspdf';
import { getLanguage, tr, type Language } from '../i18n';
import type { Snapshot } from '../domain/schema';
import { matchReport } from '../domain/report';
import { loadFonts } from './pdf/fonts';
import { createPdfLayout } from './pdf/layout';
import { drawHeader } from './pdf/header';
import { drawTeamStatistics } from './pdf/team-statistics';
import { drawPlayerStatistics } from './pdf/player-statistics';
import { drawScoreCharts } from './pdf/score-charts';
import { drawEvents } from './pdf/events';
import { drawPageNumbers } from './pdf/footer';

export async function createMatchPdf(
  data: Snapshot,
  matchId: string,
  language: Language = getLanguage(),
): Promise<File> {
  const fontData = await loadFonts();
  const report = matchReport(data, matchId);
  const t = (text: string, values: Record<string, string | number> = {}) =>
    tr(text, values, language);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  for (const [index, name] of ['normal', 'bold'].entries()) {
    doc.addFileToVFS(`handball-${name}.ttf`, fontData[index]);
    doc.addFont(`handball-${name}.ttf`, 'Handball', name);
  }
  doc.setFont('Handball');
  doc.setProperties({
    title: report.teams.map((team) => team.name).join(' - '),
    subject: t('Estadísticas del partido'),
    creator: 'handballstats',
  });
  const context = { doc, report, data, language, t, layout: createPdfLayout(doc) };
  drawHeader(context);
  drawTeamStatistics(context);
  drawPlayerStatistics(context);
  drawScoreCharts(context);
  drawEvents(context);
  drawPageNumbers(context);
  const name =
    `handball-stats-${report.match.date}-${report.teams.map((team) => team.name).join('-')}`
      .replace(/[^\p{L}\p{N}_-]/gu, '-')
      .slice(0, 180);
  return new File([doc.output('arraybuffer')], `${name}.pdf`, { type: 'application/pdf' });
}
