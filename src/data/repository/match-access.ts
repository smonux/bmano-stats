import type { HandballDatabase } from '../connection';

export async function availableMatch(database: HandballDatabase, matchId: string) {
  const match = await database.matches.get(matchId);
  if (!match || match.deletedAt !== null) {
    throw new Error('Partido no disponible.');
  }
  return match;
}
