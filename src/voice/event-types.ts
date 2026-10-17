import type { EventType } from '../domain/model';

/** Canonical voice keys are part of the dataset and draft contract. */
export const spokenTypes = {
  gol: 'goal',
  parada: 'save',
  fallo: 'miss',
  perdida: 'loss',
  recuperacion: 'recovery',
  penalti_cometido: 'penalty',
  exclusion: 'exclusion',
  amarilla: 'yellow',
  descalificacion: 'disqualification',
  pasivo: 'passive',
  infraccion: 'infraction',
  sustitucion: 'substitution',
} as const satisfies Record<string, EventType>;

export type SpokenEvent = keyof typeof spokenTypes;
export const spokenEvents = Object.keys(spokenTypes) as SpokenEvent[];
