import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { type Snapshot } from '../domain/model';
import { calculate, efficacy, emptyStats, labels, type Metric, type Stats } from '../domain/statistics';
import { Empty } from './ui';
const rows: Metric[] = ['losses', 'recoveries', 'exclusions', 'infractions', 'passives'];
function Metrics({ stats, player = false }: { stats: Stats; player?: boolean }) {
  return <><div className="metrics"><div><span>Goles</span><strong>{stats.goals}</strong></div><div><span>Fallados</span><strong>{stats.misses}</strong></div><div><span>Eficacia de tiro</span><strong>{efficacy(stats)}</strong></div><div><span>Paradas</span><strong>{stats.saves}</strong></div></div><dl className="stat-list">{[...rows.filter(k => !player || k !== 'passives'), ...(player ? ['forcedExclusions', 'assists'] as Metric[] : [])].map(k => <div key={k}><dt>{labels[k]}</dt><dd>{stats[k]}</dd></div>)}</dl></>;
}
export function Statistics({ data, matchId }: { data: Snapshot; matchId?: string }) {
  const matches = data.matches.filter(m => !m.deletedAt && (!matchId || m.id === matchId));
  const teamIds = new Set(matches.flatMap(m => [m.localTeamId, m.visitorTeamId]));
  const teams = data.teams.filter(t => !t.deletedAt && (!matchId || teamIds.has(t.id)));
  const [selectedTeam, setTeam] = useState(teams[0]?.id ?? '');
  const team = teams.some(t => t.id === selectedTeam) ? selectedTeam : teams[0]?.id ?? '';
  const [selectedMatch, setMatch] = useState('all');
  const [view, setView] = useState('team');
  const [selectedPlayer, setPlayer] = useState<string | null>(null);
  const available = matches.filter(m => [m.localTeamId, m.visitorTeamId].includes(team));
  const chosen = available.filter(m => selectedMatch === 'all' || m.id === selectedMatch);
  const stats = calculate(chosen, data.events, data.players);
  const player = data.players.find(p => p.id === selectedPlayer && p.teamId === team);
  const players = data.players.filter(p => p.teamId === team && (!p.deletedAt || stats.players[p.id])).sort((a,b) => Number(a.isUnknown) - Number(b.isUnknown) || (a.dorsal ?? 0) - (b.dorsal ?? 0));
  const teamName = (id: string) => data.teams.find(t => t.id === id)?.name ?? 'Equipo';
  if (!teams.length) return <Empty title="Todo empieza con un equipo"><p>Crea un partido o un equipo para consultar sus estadísticas.</p></Empty>;
  return <div className="statistics"><div className="filter-row"><label>Equipo<select value={team} onChange={e => { setTeam(e.target.value); setMatch('all'); setPlayer(null); }}>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>{!matchId && <label>Partido<select value={selectedMatch} onChange={e => { setMatch(e.target.value); setPlayer(null); }}><option value="all">Todos los partidos</option>{available.map(m => <option key={m.id} value={m.id}>{m.date} · {teamName(m.localTeamId)} — {teamName(m.visitorTeamId)}</option>)}</select></label>}</div><div className="tabs" role="tablist" aria-label="Tipo de estadísticas"><button role="tab" aria-selected={view === 'team'} className={view === 'team' ? 'selected' : ''} onClick={() => { setView('team'); setPlayer(null); }}>Equipo</button><button role="tab" aria-selected={view === 'players'} className={view === 'players' ? 'selected' : ''} onClick={() => setView('players')}>Jugadores</button></div>{view === 'team' ? <Metrics stats={stats.teams[team] ?? emptyStats()}/> : player ? <><button className="back" onClick={() => setPlayer(null)}><ChevronLeft size={16}/> Todos los jugadores</button><h3>{player.isUnknown ? 'Desconocido' : `#${player.dorsal} · ${player.name || 'Sin nombre'}`}</h3><Metrics player stats={stats.players[player.id] ?? emptyStats()}/></> : <div className="player-stats"><div className="player-stat-head"><span>Jugador</span><span>Goles</span><span>Fallados</span><span/></div>{players.map(p => <button className="player-stat" key={p.id} onClick={() => setPlayer(p.id)}><span><b className="jersey">{p.dorsal ?? '?'}</b>{p.name || 'Sin nombre'}</span><strong>{stats.players[p.id]?.goals ?? 0}</strong><strong>{stats.players[p.id]?.misses ?? 0}</strong><ChevronRight size={16}/></button>)}</div>}<p className="caption">Solo se contabilizan los eventos válidos registrados. Pasivos separados de pérdidas.</p></div>;
}
