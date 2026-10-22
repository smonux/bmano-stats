import type { Match, Player } from './schema';

/** A remembered selection belongs to this team and match, and must remain available. */
export function lastGoalkeeper(match: Match, players: Player[], teamId: string | null) {
  if (!teamId || ![match.localTeamId, match.visitorTeamId].includes(teamId)) return;
  const id = match.lastGoalkeepers?.[teamId];
  return players.find(
    (player) =>
      player.id === id &&
      player.teamId === teamId &&
      player.isGoalkeeper &&
      !player.isUnknown &&
      !player.deletedAt &&
      player.dorsal !== null,
  );
}
