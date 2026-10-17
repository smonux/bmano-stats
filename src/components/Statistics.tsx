import { tr } from '../i18n';
import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { type Snapshot } from '../domain/model';
import {
  calculate,
  efficacy,
  emptyStats,
  labels,
  type Metric,
  type Stats,
} from '../domain/statistics';
import { Empty } from './ui';
import { ScoreCharts } from './ScoreCharts';
import { ShareMatchPdf } from './ShareMatchPdf';
import { WheelPicker } from './WheelPicker';
const rows: Metric[] = [
  'losses',
  'recoveries',
  'exclusions',
  'infractions',
  'passives',
  'substitutions',
];
function Metrics({ stats, player = false }: { stats: Stats; player?: boolean }) {
  return (
    <>
      <div className="metrics">
        <div>
          <span>{tr('Goles')}</span>
          <strong>{stats.goals}</strong>
        </div>
        <div>
          <span>{tr('Fallados')}</span>
          <strong>{stats.misses}</strong>
        </div>
        <div>
          <span>{tr('Eficacia de tiro')}</span>
          <strong>{efficacy(stats)}</strong>
        </div>
        <div>
          <span>{tr('Paradas')}</span>
          <strong>{stats.saves}</strong>
        </div>
      </div>
      <dl className="stat-list">
        {[
          ...rows.filter((k) => !player || !['passives', 'substitutions'].includes(k)),
          ...(player
            ? (['forcedExclusions', 'assists', 'substitutionsOut', 'substitutionsIn'] as Metric[])
            : []),
        ].map((k) => (
          <div key={k}>
            <dt>{tr(labels[k] ?? k)}</dt>
            <dd>{stats[k]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
export function Statistics({ data, matchId }: { data: Snapshot; matchId?: string }) {
  const matches = data.matches.filter((m) => !m.deletedAt && (!matchId || m.id === matchId));
  const teamIds = new Set(matches.flatMap((m) => [m.localTeamId, m.visitorTeamId]));
  const teams = data.teams.filter((t) => !t.deletedAt && (!matchId || teamIds.has(t.id)));
  const [selectedTeam, setTeam] = useState(teams[0]?.id ?? '');
  const team = teams.some((t) => t.id === selectedTeam) ? selectedTeam : (teams[0]?.id ?? '');
  const [selectedMatch, setMatch] = useState('all');
  const [view, setView] = useState('team');
  const [selectedPlayer, setPlayer] = useState<string | null>(null);
  const available = matches.filter((m) => [m.localTeamId, m.visitorTeamId].includes(team));
  const chosen = available.filter((m) => selectedMatch === 'all' || m.id === selectedMatch);
  const stats = calculate(chosen, data.events, data.players);
  const player = data.players.find((p) => p.id === selectedPlayer && p.teamId === team);
  const players = data.players
    .filter((p) => p.teamId === team && (!p.deletedAt || stats.players[p.id]))
    .sort((a, b) => Number(a.isUnknown) - Number(b.isUnknown) || (a.dorsal ?? 0) - (b.dorsal ?? 0));
  const teamName = (id: string) => data.teams.find((t) => t.id === id)?.name ?? tr('Equipo');
  if (!teams.length) {
    return (
      <Empty title={tr('Todo empieza con un equipo')}>
        <p>{tr('Crea un partido o un equipo para consultar sus estadísticas.')}</p>
      </Empty>
    );
  }
  return (
    <div className="statistics">
      <div className="filter-row">
        <WheelPicker
          label={tr('Equipo')}
          value={team}
          options={teams.map((team) => ({ value: team.id, label: team.name }))}
          change={(teamId) => {
            setTeam(teamId);
            setMatch('all');
            setPlayer(null);
          }}
        />
        {!matchId && (
          <WheelPicker
            label={tr('Partido')}
            value={selectedMatch}
            options={[
              { value: 'all', label: tr('Todos los partidos') },
              ...available.map((match) => ({
                value: match.id,
                label: `${match.date} · ${teamName(match.localTeamId)} — ${teamName(match.visitorTeamId)}`,
              })),
            ]}
            change={(matchId) => {
              setMatch(matchId);
              setPlayer(null);
            }}
          />
        )}
      </div>
      <div className="tabs" role="tablist" aria-label={tr('Tipo de estadísticas')}>
        <button
          role="tab"
          aria-selected={view === 'team'}
          className={view === 'team' ? 'selected' : ''}
          onClick={() => {
            setView('team');
            setPlayer(null);
          }}
        >
          {tr('Equipo')}
        </button>
        <button
          role="tab"
          aria-selected={view === 'players'}
          className={view === 'players' ? 'selected' : ''}
          onClick={() => setView('players')}
        >
          {tr('Jugadores')}
        </button>
      </div>
      {view === 'team' ? (
        <Metrics stats={stats.teams[team] ?? emptyStats()} />
      ) : player ? (
        <>
          <button className="back" onClick={() => setPlayer(null)}>
            <ChevronLeft size={16} /> {tr('Todos los jugadores')}
          </button>
          <h3>
            {player.isUnknown
              ? tr('Desconocido')
              : `#${player.dorsal} · ${player.name || tr('Sin nombre')}`}
          </h3>
          <Metrics player stats={stats.players[player.id] ?? emptyStats()} />
        </>
      ) : (
        <div className="player-stats">
          <div className="player-stat-head">
            <span>{tr('Jugador')}</span>
            <span>{tr('Goles')}</span>
            <span>{tr('Fallados')}</span>
            <span />
          </div>
          {players.map((p) => (
            <button className="player-stat" key={p.id} onClick={() => setPlayer(p.id)}>
              <span>
                <b className="jersey">{p.dorsal ?? '?'}</b>
                {p.isUnknown ? tr('Desconocido') : p.name || tr('Sin nombre')}
              </span>
              <strong>{stats.players[p.id]?.goals ?? 0}</strong>
              <strong>{stats.players[p.id]?.misses ?? 0}</strong>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
      <p className="caption">
        {tr('Solo se contabilizan los eventos válidos registrados. Pasivos separados de pérdidas.')}
      </p>
      {chosen.length === 1 && (
        <>
          <ScoreCharts data={data} match={chosen[0]} />
          <ShareMatchPdf data={data} matchId={chosen[0].id} />
        </>
      )}
    </div>
  );
}
