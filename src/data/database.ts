import { db } from './connection';
import { catalogRepository } from './repository/catalog';
import { matchesRepository } from './repository/matches';
import { eventsRepository } from './repository/events';
import { backupsRepository } from './repository/backups';

export { HandballDatabase, db } from './connection';
export type { TeamChoice, EventDraft } from './repository/types';

/** Public persistence API; each operation owns its complete IndexedDB transaction. */
export function repository(database = db) {
  return {
    ...catalogRepository(database),
    ...matchesRepository(database),
    ...eventsRepository(database),
    ...backupsRepository(database),
  };
}

export const repo = repository();
