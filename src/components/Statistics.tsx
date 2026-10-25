import { TabBar, TabPanel } from './ui/TabBar';
import { tr } from '../i18n';
import { useId, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { type Snapshot } from '../domain/model';
import { calculate, emptyStats } from '../domain/statistics';
import { Metrics } from './statistics/Metrics';
import { Empty } from './ui';
import { ScoreCharts } from './ScoreCharts';
import { ShareMatchPdf } from './ShareMatchPdf';
import { WheelPicker } from './WheelPicker';
import { ChoiceGroup } from './event-editor/ChoiceGroup';
export function Statistics({ data, matchId }: { data: Snapshot; matchId?: string }) {
  const tabsId = useId();
  const matches = data.matches.filter(
    (match) => !match.deletedAt && (!matchId || match.id === matchId),
  );
  const teamIds = new Set(matches.flatMap((match) => [match.localTeamId, match.visitorTeamId]));
  const teams = data.teams.filter((team) => !team.deletedAt && (!matchId || teamIds.has(team.id)));
  const ownTeamId = matchId
    ? matches.find((match) => match.id === matchId)?.localTeamId
    : undefined;
  const initialTeamId = teams.find((team) => team.id === ownTeamId)?.id ?? teams[0]?.id ?? '';
  const [selection, setSelection] = useState({ matchId, teamId: initialTeamId });
  // A new match starts from its own perspective; live updates keep an explicit selection.
  const selectedTeam = selection.matchId === matchId ? selection.teamId : initialTeamId;
  const teamId = teams.some((team) => team.id === selectedTeam) ? selectedTeam : initialTeamId;
  const [selectedMatch, setMatch] = useState('all');
  const [view, setView] = useState('team');
  const [selectedPlayer, setPlayer] = useState<string | null>(null);
  const availableMatches = matches.filter((match) =>
    [match.localTeamId, match.visitorTeamId].includes(teamId),
  );
  const chosenMatches = availableMatches.filter(
    (match) => selectedMatch === 'all' || match.id === selectedMatch,
  );
  const stats = calculate(chosenMatches, data.events, data.players);
  const player = data.players.find(
    (player) => player.id === selectedPlayer && player.teamId === teamId,
  );
  const players = data.players
    .filter((player) => player.teamId === teamId && (!player.deletedAt || stats.players[player.id]))
    .sort((a, b) => Number(a.isUnknown) - Number(b.isUnknown) || (a.dorsal ?? 0) - (b.dorsal ?? 0));
  const teamName = (id: string) => data.teams.find((team) => team.id === id)?.name ?? tr('Equipo');
  const selectTeam = (teamId: string) => {
    setSelection({ matchId, teamId });
    setMatch('all');
    setPlayer(null);
  };
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
        {matchId ? (
          <ChoiceGroup
            label={tr('Equipo')}
            value={teamId}
            options={[matches[0].localTeamId, matches[0].visitorTeamId].map((id, index) => ({
              value: id,
              label: teamName(id),
              content: (
                <>
                  <small>
                    {tr('Equipo')} {index + 1}
                  </small>
                  <strong>{teamName(id)}</strong>
                </>
              ),
              accessibleLabel: teamName(id),
            }))}
            change={selectTeam}
          />
        ) : (
          <WheelPicker
            label={tr('Equipo')}
            value={teamId}
            options={teams.map((team) => ({
              value: team.id,
              label: team.name,
            }))}
            change={selectTeam}
          />
        )}
        {!matchId && (
          <WheelPicker
            label={tr('Partido')}
            value={selectedMatch}
            options={[
              {
                value: 'all',
                label: tr('Todos los partidos'),
              },
              ...availableMatches.map((match) => ({
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
      <h3 className="statistics-team-name">{teamName(teamId)}</h3>
      <TabBar
        id={tabsId}
        label={tr('Tipo de estadísticas')}
        value={view}
        tabs={[
          { value: 'team', label: tr('Equipo') },
          { value: 'players', label: tr('Jugadores') },
        ]}
        change={(value) => {
          setView(value);
          setPlayer(null);
        }}
      />
      <TabPanel id={tabsId} value="team" selected={view}>
        <Metrics stats={stats.teams[teamId] ?? emptyStats()} />
      </TabPanel>
      <TabPanel id={tabsId} value="players" selected={view}>
        {player ? (
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
            {players.map((player) => (
              <button className="player-stat" key={player.id} onClick={() => setPlayer(player.id)}>
                <span>
                  <b className="jersey">{player.dorsal ?? '?'}</b>
                  {player.isUnknown ? tr('Desconocido') : player.name || tr('Sin nombre')}
                </span>
                <strong>{stats.players[player.id]?.goals ?? 0}</strong>
                <strong>{stats.players[player.id]?.misses ?? 0}</strong>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        )}
      </TabPanel>
      <p className="caption">
        {tr('Solo se contabilizan los eventos válidos registrados. Pasivos separados de pérdidas.')}
      </p>
      {chosenMatches.length === 1 && (
        <>
          <ScoreCharts data={data} match={chosenMatches[0]} />
          <ShareMatchPdf data={data} matchId={chosenMatches[0].id} />
        </>
      )}
    </div>
  );
}
