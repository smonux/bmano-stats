import { tr } from '../i18n';
import type { Match, Snapshot } from '../domain/model';
import { scoreTimelines } from '../domain/report';
export function ScoreCharts({ data, match }: { data: Snapshot; match: Match }) {
  const names = [match.localTeamId, match.visitorTeamId].map(
    (id) => data.teams.find((team) => team.id === id)?.name ?? tr('Equipo'),
  );
  return (
    <section className="score-charts" aria-label={tr('Evolución del marcador')}>
      <h3>{tr('Evolución del marcador')}</h3>
      <p className="caption">
        {tr('Marcador acumulado. Cada escalón corresponde a un gol en su minuto.')}
      </p>
      <div className="score-legend">
        {names.map((name, i) => (
          <span key={i}>
            <i className={i ? 'opponent-line' : 'own-line'} />
            {name}
          </span>
        ))}
      </div>
      <div className="period-charts">
        {scoreTimelines(data, match).map((period) => {
          const maxGoals = Math.max(5, Math.ceil(Math.max(...period.end) / 5) * 5);
          const x = (minute: number) => 54 + (minute / period.maxMinute) * 346;
          const y = (goals: number) => 180 - (goals / maxGoals) * 130;
          return (
            <figure key={period.period}>
              <figcaption>
                {tr('Tiempo')} {period.period} · {period.start.join('-')} / {period.end.join('-')}
              </figcaption>
              <svg
                viewBox="0 0 420 250"
                role="img"
                aria-label={tr('Marcador por minuto del tiempo {period}', {
                  period: period.period,
                })}
              >
                {Array.from(
                  {
                    length: 6,
                  },
                  (_, i) => (
                    <g key={i}>
                      <line
                        x1="54"
                        x2="400"
                        y1={y((maxGoals * i) / 5)}
                        y2={y((maxGoals * i) / 5)}
                        stroke="#deded7"
                      />
                      <text x="46" y={y((maxGoals * i) / 5) + 7} textAnchor="end">
                        {(maxGoals * i) / 5}
                      </text>
                      <text
                        x={x(Math.round((period.maxMinute * i) / 5))}
                        y="210"
                        textAnchor="middle"
                      >
                        {Math.round((period.maxMinute * i) / 5)}
                      </text>
                    </g>
                  ),
                )}
                <text x="5" y="24">
                  {tr('Goles')}
                </text>
                <text x="400" y="242" textAnchor="end">
                  {tr('Minutos')}
                </text>
                {period.series.map((points, i) => {
                  const path = points
                    .map((point) => `${x(point.minute)},${y(point.goals)}`)
                    .join(' ');
                  return (
                    <g key={i}>
                      {!i && (
                        <polyline points={path} fill="none" stroke="#766500" strokeWidth="4" />
                      )}
                      <polyline
                        points={path}
                        fill="none"
                        stroke={i ? '#171717' : '#ffd600'}
                        strokeWidth="2"
                        strokeDasharray={i ? '6 3' : undefined}
                      />
                      {points
                        .filter((point) => point.goal)
                        .map((point, j) => (
                          <circle
                            key={j}
                            cx={x(point.minute)}
                            cy={y(point.goals)}
                            r="2.5"
                            fill={i ? '#171717' : '#ffd600'}
                            stroke="#171717"
                            strokeWidth=".5"
                          />
                        ))}
                    </g>
                  );
                })}
              </svg>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
