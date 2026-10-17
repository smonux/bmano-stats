import type { jsPDF } from 'jspdf';
import type { Language } from '../../i18n';
import type { MatchReport } from '../../domain/report';
import type { Snapshot } from '../../domain/schema';
import type { createPdfLayout } from './layout';

export type Translate = (text: string, values?: Record<string, string | number>) => string;
export type PdfContext = {
  doc: jsPDF;
  layout: ReturnType<typeof createPdfLayout>;
  report: MatchReport;
  data: Snapshot;
  language: Language;
  t: Translate;
};
export const pdfTheme = {
  ink: [23, 23, 23] as [number, number, number],
  yellow: [255, 214, 0] as [number, number, number],
  margin: 12,
  width: 186,
  bottom: 282,
};
