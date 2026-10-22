import { expect, test, vi } from 'vitest';
import { drawEvents } from './events';
import type { PdfContext } from './context';
import { matchReport } from '../../domain/report';
import { reportFixture } from '../../../tests/fixtures/report';

test('PDF notes contain the reminder and original transcription without an unknown player', () => {
  const data = reportFixture();
  const note = 'El árbitro advierte a Sara.\nRecordarlo al descanso.';
  const rawText = `Nota: ${note}`;
  data.events = [
    {
      ...data.events[0],
      type: 'note',
      teamId: null,
      primaryPlayerId: null,
      relatedPlayerId: null,
      metadata: {},
      note,
      rawText,
    },
  ];
  const table = vi.fn();
  // Inspect the actual event rows passed to the shared PDF layout.
  const context = {
    data,
    report: matchReport(data, 'report-match'),
    language: 'es',
    t: (text: string) => text,
    doc: { setFontSize: vi.fn(), setFont: vi.fn(), text: vi.fn() },
    layout: { room: vi.fn(), title: vi.fn(), table, cursorY: 0 },
  } as unknown as PdfContext;
  drawEvents(context);
  expect(table).toHaveBeenCalledTimes(1);
  expect(table.mock.calls[0][1]).toEqual([
    [
      String(data.events[0].minute),
      'Sin equipo',
      'Nota',
      `Nota: ${note}\nTranscripción original: ${rawText}`,
    ],
  ]);
});
