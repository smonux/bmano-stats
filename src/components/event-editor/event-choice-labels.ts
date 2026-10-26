import type { EventType } from '../../domain/event-definitions';

/** Short labels for the editor; event identities, voice vocabulary and report labels stay stable. */
export const eventChoiceLabels: Record<EventType, string> = {
  goal: 'Gol',
  save: 'Parada',
  miss: 'Fallo',
  loss: 'Pérdida',
  recovery: 'Recuperación',
  penalty: 'Penalti',
  exclusion: '2 min',
  yellow: 'Amarilla',
  disqualification: 'Roja',
  passive: 'Pasivo',
  infraction: 'Infracción',
  substitution: 'Cambio',
  note: 'Nota',
};
