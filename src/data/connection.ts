import Dexie, { type EntityTable } from 'dexie';
import type { Team, Player, Match, GameEvent, Snapshot } from '../domain/schema';

export class HandballDatabase extends Dexie {
  teams!: EntityTable<Team, 'id'>;
  players!: EntityTable<Player, 'id'>;
  matches!: EntityTable<Match, 'id'>;
  events!: EntityTable<GameEvent, 'id'>;
  constructor(name = 'handball-stats-v1') {
    super(name);
    this.version(1).stores({
      teams: 'id, &nameKey',
      players: 'id, teamId, &[teamId+dorsal]',
      matches: 'id, date, status',
      events: 'id, matchId, [matchId+orderKey]',
    });
  }
  async snapshot(): Promise<Snapshot> {
    return this.transaction('r', this.tables, async () => ({
      teams: await this.teams.toArray(),
      players: await this.players.toArray(),
      matches: await this.matches.toArray(),
      events: await this.events.toArray(),
    }));
  }
}
export const db = new HandballDatabase();
