import {
  eventState,
  opponent,
  relatedTeam,
  unknownId,
  type GameEvent,
  type Match,
  type Player,
} from './model';
export const metrics = [
  'goals',
  'shots',
  'misses',
  'saves',
  'goalsReceived',
  'shotsReceived',
  'losses',
  'recoveries',
  'penalties',
  'penaltiesReceived',
  'exclusions',
  'yellow',
  'disqualifications',
  'blue',
  'passives',
  'infractions',
  'Pasos',
  'Dobles',
  'Pisando',
  'assists',
  'forcedExclusions',
  'penaltyGoals',
  'penaltyMisses',
  'penaltySaves',
  'substitutions',
  'substitutionsOut',
  'substitutionsIn',
] as const;
export type Metric = (typeof metrics)[number];
export type Stats = Record<Metric, number>;
export const emptyStats = (): Stats => Object.fromEntries(metrics.map((k) => [k, 0])) as Stats;
export const efficacy = (s: Stats) =>
  s.shots ? `${Math.round((100 * s.goals) / s.shots)} %` : '—';
export const labels: Partial<Record<Metric, string>> = {
  substitutions: 'Sustituciones',
  substitutionsOut: 'Salidas',
  substitutionsIn: 'Entradas',
  goals: 'Goles',
  misses: 'Lanzamientos fallados',
  saves: 'Paradas',
  losses: 'Pérdidas',
  recoveries: 'Recuperaciones',
  exclusions: 'Exclusiones (2 min)',
  passives: 'Pasivos',
  infractions: 'Infracciones',
  forcedExclusions: 'Exclusiones forzadas',
  assists: 'Asistencias',
  penalties: 'Penaltis cometidos',
  yellow: 'Amarillas',
  disqualifications: 'Descalificaciones',
};

export function calculate(matches: Match[], events: GameEvent[], players: Player[]) {
  const teams: Record<string, Stats> = {};
  const individual: Record<string, Stats> = {};
  const byMatch = new Map(matches.filter((m) => m.deletedAt === null).map((m) => [m.id, m]));
  const add = (target: Record<string, Stats>, id: string, metric: Metric) => {
    (target[id] ??= emptyStats())[metric]++;
  };
  for (const e of events) {
    const m = byMatch.get(e.matchId);
    if (!m || ['pending', 'deleted'].includes(eventState(e, m, players)) || !e.type || !e.teamId) {
      continue;
    }
    const t = e.teamId;
    const other = opponent(m, t);
    const p = e.primaryPlayerId ?? unknownId(t);
    const r = e.relatedPlayerId ?? unknownId(relatedTeam(m, e.type, t));
    const own = (...keys: Metric[]) =>
      keys.forEach((k) => {
        add(teams, t, k);
        add(individual, p, k);
      });
    const rivalTeam = (...keys: Metric[]) => keys.forEach((k) => add(teams, other, k));
    switch (e.type) {
      case 'substitution':
        add(teams, t, 'substitutions');
        add(individual, p, 'substitutionsOut');
        add(individual, r, 'substitutionsIn');
        break;
      case 'goal':
        own('goals', 'shots');
        rivalTeam('goalsReceived', 'shotsReceived');
        if (e.relatedPlayerId) {
          add(individual, r, 'assists');
        }
        if (e.metadata.penalty) {
          own('penaltyGoals');
        }
        break;
      case 'save':
        own('saves');
        add(teams, t, 'shotsReceived');
        rivalTeam('shots', 'misses');
        add(individual, r, 'shots');
        add(individual, r, 'misses');
        if (e.metadata.penalty) {
          own('penaltySaves');
          rivalTeam('penaltyMisses');
          add(individual, r, 'penaltyMisses');
        }
        break;
      case 'miss':
        own('shots', 'misses');
        rivalTeam('shotsReceived');
        if (e.metadata.penalty) {
          own('penaltyMisses');
        }
        break;
      case 'loss':
        own('losses');
        break;
      case 'recovery':
        own('recoveries');
        rivalTeam('losses');
        add(individual, r, 'losses');
        break;
      case 'penalty':
        own('penalties');
        rivalTeam('penaltiesReceived');
        break;
      case 'exclusion':
        own('exclusions');
        if (e.relatedPlayerId && !players.find((p) => p.id === r)?.isUnknown) {
          add(individual, r, 'forcedExclusions');
        }
        break;
      case 'yellow':
        own('yellow');
        break;
      case 'disqualification':
        own('disqualifications');
        if (e.metadata.blue) {
          own('blue');
        }
        break;
      case 'passive':
        add(teams, t, 'passives');
        break;
      case 'infraction':
        own('infractions', 'losses', e.metadata.infraction!);
        break;
    }
  }
  return { teams, players: individual };
}
