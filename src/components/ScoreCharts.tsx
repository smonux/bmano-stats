import { tr } from '../i18n';
import type { Match, Snapshot } from '../domain/model';
import { scoreTimelines } from '../domain/report';
export function ScoreCharts({ data, match }: { data: Snapshot; match: Match }) {
  const names = [match.localTeamId, match.visitorTeamId].map(
    (id) => data.teams.find((t) => t.id === id)?.name ?? tr('Equipo'),
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
          const max = Math.max(5, Math.ceil(Math.max(...period.end) / 5) * 5),
            x = (minute: number) => 34 + (minute / period.maxMinute) * 286,
            y = (goals: number) => 142 - (goals / max) * 114;
          return (
            <figure key={period.period}>
              <figcaption>
                {tr('Tiempo')} {period.period} · {period.start.join('-')} / {period.end.join('-')}
              </figcaption>
              <svg
                viewBox="0 0 340 170"
                role="img"
                aria-label={tr('Marcador por minuto del tiempo {period}', {
                  period: period.period,
                })}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <g key={i}>
                    <line
                      x1="34"
                      x2="320"
                      y1={y((max * i) / 5)}
                      y2={y((max * i) / 5)}
                      stroke="#deded7"
                    />
                    <text x="29" y={y((max * i) / 5) + 3} textAnchor="end">
                      {(max * i) / 5}
                    </text>
                    <text x={x((period.maxMinute * i) / 5)} y="157" textAnchor="middle">
                      {(period.maxMinute * i) / 5}
                    </text>
                  </g>
                ))}
                <text x="5" y="13">
                  {tr('Goles')}
                </text>
                <text x="320" y="169" textAnchor="end">
                  {tr('Minutos')}
                </text>
                {period.series.map((points, i) => {
                  const path = points.map((p) => `${x(p.minute)},${y(p.goals)}`).join(' ');
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
                        .filter((p) => p.goal)
                        .map((p, j) => (
                          <circle
                            key={j}
                            cx={x(p.minute)}
                            cy={y(p.goals)}
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
