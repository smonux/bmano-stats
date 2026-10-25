import type { PeriodTimeline } from '../../domain/score-timeline';
import { tr } from '../../i18n';

/** Initial totals and every goal are sufficient to read both step lines without an SVG. */
export function TimelineData({
  period,
  teams,
}: {
  period: PeriodTimeline;
  teams: [string, string];
}) {
  const rows = period.series.flatMap((points, team) =>
    points
      .filter((point, index) => index === 0 || point.goal)
      .map((point, index) => ({ ...point, team, index })),
  );
  rows.sort((a, b) => a.minute - b.minute || a.team - b.team || a.index - b.index);
  return (
    <details className="chart-data">
      <summary>{tr('Ver datos del gráfico')}</summary>
      <p className="caption">
        {tr('Tiempo')} {period.period} · {tr('Inicio')} {period.start.join('–')} · {tr('Marcador')}{' '}
        {period.end.join('–')}
      </p>
      <table>
        <caption>{tr('Goles acumulados por minuto y equipo')}</caption>
        <thead>
          <tr>
            <th scope="col">{tr('Minuto')}</th>
            <th scope="col">{tr('Equipo')}</th>
            <th scope="col">{tr('Goles')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((point, index) => (
            <tr key={index} data-kind={point.goal ? 'goal' : 'start'}>
              <th scope="row">
                {point.minute}′{!point.goal && <small> · {tr('Inicio')}</small>}
              </th>
              <td>
                {point.team + 1} · {teams[point.team]}
              </td>
              <td>{point.goals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
