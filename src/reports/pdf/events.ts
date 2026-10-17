import { pdfTheme, type PdfContext } from './context';
import { definitions } from '../../domain/event-definitions';
import { eventState } from '../../domain/events';
export function drawEvents(context: PdfContext) {
  const { doc, layout, report, data, t } = context;
  const { room, title, table } = layout;
  const { ink, margin } = pdfTheme;
  room(48);
  title(t('Eventos por tiempo'));
  doc.setFontSize(7);
  doc.setFont('Handball', 'normal');
  doc.text(
    t(
      'Orden cronológico creciente. Los pendientes no cuentan en el marcador ni en las estadísticas.',
    ),
    margin,
    layout.cursorY,
  );
  layout.cursorY += 5;
  for (let period = 1; period <= report.match.clock.period; period++) {
    const events = report.events.filter((event) => event.period === period);
    title(`${t('Tiempo')} ${period}`);
    if (!events.length) {
      doc.setFont('Handball', 'normal');
      doc.setFontSize(7);
      doc.text(t('Sin eventos registrados'), margin, layout.cursorY);
      layout.cursorY += 5;
      continue;
    }
    const player = (id: string | null) => {
      const player = data.players.find((item) => item.id === id);
      return !player || player.isUnknown
        ? t('Desconocido')
        : `#${player.dorsal}${player.name ? ' ' + player.name : ''}`;
    };
    table(
      [t('Minuto'), t('Equipo'), t('Evento'), t('Jugadores')],
      events.map((event) => {
        const definition = event.type ? definitions[event.type] : null;
        const kind = [
          definition ? t(definition.label) : t('Evento sin indicar'),
          event.metadata.penalty ? '7 m' : '',
          event.metadata.blue ? t('Tarjeta azul') : '',
          event.metadata.infraction ? t(event.metadata.infraction) : '',
          eventState(event, report.match, data.players) === 'pending' ? t('Pendiente') : '',
        ]
          .filter(Boolean)
          .join(' · ');
        const participants =
          event.type === 'passive'
            ? ''
            : (event.type === 'substitution' ? `${t('Sale')}: ` : '') +
              player(event.primaryPlayerId) +
              (event.relatedPlayerId && definition?.related
                ? ` / ${t(definition.related)}: ${player(event.relatedPlayerId)}`
                : '');
        const team = report.teams.findIndex((team) => team.id === event.teamId);
        const details = [
          participants,
          event.note.trim() ? `${t('Nota')}: ${event.note}` : '',
          event.rawText.trim() ? `${t('Transcripción original')}: ${event.rawText}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        return [String(event.minute), team < 0 ? t('Sin equipo') : String(team + 1), kind, details];
      }),
      {
        columnStyles: {
          0: {
            cellWidth: 13,
          },
          1: {
            cellWidth: 15,
          },
          2: {
            cellWidth: 47,
          },
          3: {
            cellWidth: 111,
          },
        },
        styles: {
          font: 'Handball',
          fontSize: 7,
          cellPadding: 1,
          lineWidth: 0.1,
          lineColor: [225, 225, 220],
          textColor: ink,
          overflow: 'linebreak',
        },
        didDrawPage: ({ pageNumber }: { pageNumber: number }) => {
          if (pageNumber > 1) {
            doc.setFont('Handball', 'bold');
            doc.setFontSize(8);
            doc.text(`${t('Eventos por tiempo')} - ${t('Tiempo')} ${period}`, margin, 13);
          }
        },
      },
    );
  }
}
