import { chronological } from './events';
import type { Snapshot } from './schema';
import { calculate } from './statistics';
import { scoreTimelines } from './score-timeline';
export { scoreTimelines, type ScorePoint, type PeriodTimeline } from './score-timeline';

export function matchReport(data: Snapshot, matchId: string, now = Date.now()) {
  const match = data.matches.find((candidate) => candidate.id === matchId && !candidate.deletedAt);
  if (!match) {
    throw new Error('Partido no encontrado');
  }
  const events = data.events
    .filter((event) => event.matchId === matchId && !event.deletedAt)
    .sort(chronological);
  const stats = calculate([match], events, data.players);
  const teams = [match.localTeamId, match.visitorTeamId].map((id) =>
    data.teams.find((team) => team.id === id)!,
  );
  return {
    match,
    events,
    stats,
    teams,
    periods: scoreTimelines(data, match, now),
    generatedAt: now,
  };
}

export type MatchReport = ReturnType<typeof matchReport>;
