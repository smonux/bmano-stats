import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { pdfTheme } from './context';

/** All sections share the same cursor, table defaults and page-break policy. */
export function createPdfLayout(doc: jsPDF) {
  const { ink, margin, bottom } = pdfTheme;
  let cursorY = 0;
  const newPage = () => {
    doc.addPage();
    cursorY = 19;
  };
  const room = (height: number) => {
    if (cursorY + height > bottom) {
      newPage();
    }
  };
  const title = (text: string) => {
    room(25);
    doc.setFont('Handball', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text(text, margin, cursorY + 5);
    cursorY += 9;
  };
  const table = (head: string[], body: string[][], options: Record<string, unknown> = {}) => {
    autoTable(doc, {
      startY: cursorY,
      head: [head],
      body,
      margin: { left: margin, right: margin, top: 19, bottom: 16 },
      styles: {
        font: 'Handball',
        fontSize: 7.1,
        textColor: ink,
        cellPadding: 1.15,
        lineColor: [225, 225, 220],
        lineWidth: 0.1,
        overflow: 'linebreak',
      },
      headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 243] },
      rowPageBreak: 'avoid',
      ...options,
    });
    cursorY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  };
  return {
    get cursorY() {
      return cursorY;
    },
    set cursorY(value: number) {
      cursorY = value;
    },
    room,
    title,
    table,
  };
}
