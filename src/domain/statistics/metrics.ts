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
export const emptyStats = (): Stats =>
  Object.fromEntries(metrics.map((metric) => [metric, 0])) as Stats;
export const efficacy = (stats: Stats) =>
  stats.shots ? `${Math.round((100 * stats.goals) / stats.shots)} %` : '—';
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
