import { validateBackup } from '../../domain/backup';
import type { Backup } from '../../domain/schema';
import type { HandballDatabase } from '../connection';

export function backupsRepository(database: HandballDatabase) {
  return {
    async exportBackup(): Promise<Backup> {
      return {
        format: 'handball-stats',
        version: 1,
        exportedAt: Date.now(),
        ...(await database.snapshot()),
      };
    },
    async importBackup(input: unknown) {
      const data = validateBackup(input);
      // Validate before opening the transaction; replace all collections atomically.
      await database.transaction('rw', database.tables, async () => {
        for (const table of database.tables) {
          await table.clear();
        }
        await database.teams.bulkAdd(data.teams);
        await database.players.bulkAdd(data.players);
        await database.matches.bulkAdd(data.matches);
        await database.events.bulkAdd(data.events);
      });
    },
  };
}
