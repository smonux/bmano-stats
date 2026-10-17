import { pdfTheme, type PdfContext } from './context';

export function drawPageNumbers(context: PdfContext) {
  const { doc } = context;
  const { margin } = pdfTheme;
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setFont('Handball', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100);
    doc.setDrawColor(210);
    doc.setLineWidth(0.15);
    doc.line(margin, 286, 198, 286);
    doc.text('handballstats', margin, 290);
    doc.text(`${page} / ${doc.getNumberOfPages()}`, 198, 290, { align: 'right' });
  }
}
