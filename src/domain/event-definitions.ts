export const eventTypes = [
  'goal',
  'save',
  'miss',
  'loss',
  'recovery',
  'penalty',
  'exclusion',
  'yellow',
  'disqualification',
  'passive',
  'infraction',
  'substitution',
] as const;
export type EventType = (typeof eventTypes)[number];
export type EventDefinition = {
  label: string;
  icon: string;
  principal: string;
  related?: string;
  sameTeam?: boolean;
  penalty?: boolean;
};

export const definitions: Record<EventType, EventDefinition> = {
  goal: {
    label: 'Gol',
    icon: '●',
    principal: 'Goleador',
    related: 'Asistente',
    sameTeam: true,
    penalty: true,
  },
  save: {
    label: 'Parada',
    icon: '◇',
    principal: 'Portero',
    related: 'Lanzador rival',
    penalty: true,
  },
  miss: { label: 'Lanzamiento fallado', icon: '↗', principal: 'Lanzador', penalty: true },
  loss: { label: 'Pérdida', icon: '↓', principal: 'Responsable' },
  recovery: {
    label: 'Recuperación',
    icon: '↑',
    principal: 'Recuperador',
    related: 'Rival que pierde',
  },
  penalty: {
    label: 'Penalti cometido',
    icon: '◎',
    principal: 'Infractor',
    related: 'Beneficiario rival',
  },
  exclusion: { label: 'Exclusión', icon: 'Ⅱ', principal: 'Excluido', related: 'Provocador rival' },
  yellow: { label: 'Tarjeta amarilla', icon: '▣', principal: 'Amonestado' },
  disqualification: {
    label: 'Descalificación',
    icon: '▣',
    principal: 'Descalificado',
    related: 'Provocador rival',
  },
  passive: { label: 'Pasivo', icon: '◷', principal: 'No aplica' },
  infraction: { label: 'Infracción', icon: '!', principal: 'Infractor' },
  substitution: {
    label: 'Sustitución',
    icon: '⇄',
    principal: 'Sale',
    related: 'Entra',
    sameTeam: true,
  },
};
