import { chronological, eventState } from './events';
import { elapsed } from './clock';
import type { Match, Snapshot } from './schema';

export type ScorePoint = { minute: number; goals: number; goal?: boolean };
export type PeriodTimeline = {
  period: number;
  maxMinute: number;
  start: [number, number];
  end: [number, number];
  series: [ScorePoint[], ScorePoint[]];
};
export function scoreTimelines(data: Snapshot, match: Match, now = Date.now()): PeriodTimeline[] {
  const events = data.events
    .filter((event) => event.matchId === match.id && !event.deletedAt)
    .sort(chronological);
  const cumulativeScore: [number, number] = [0, 0];
  return Array.from({ length: match.clock.period }, (_, periodIndex) => {
    const period = periodIndex + 1;
    const start: [number, number] = [...cumulativeScore];
    const periodEvents = events.filter((event) => event.period === period);
    const endMinute = Math.max(
      1,
      ...periodEvents.map((event) => event.minute),
      period === match.clock.period ? elapsed(match.clock, now) / 60000 : 0,
    );
    const maxMinute = Math.max(5, Math.ceil(endMinute / 5) * 5);
    const series: [ScorePoint[], ScorePoint[]] = [
      [{ minute: 0, goals: cumulativeScore[0] }],
      [{ minute: 0, goals: cumulativeScore[1] }],
    ];
    for (const event of periodEvents) {
      if (
        event.type !== 'goal' ||
        ['pending', 'deleted'].includes(eventState(event, match, data.players))
      ) {
        continue;
      }
      const teamIndex = event.teamId === match.localTeamId ? 0 : 1;
      series[teamIndex].push({ minute: event.minute, goals: cumulativeScore[teamIndex] });
      cumulativeScore[teamIndex]++;
      series[teamIndex].push({
        minute: event.minute,
        goals: cumulativeScore[teamIndex],
        goal: true,
      });
    }
    series[0].push({ minute: maxMinute, goals: cumulativeScore[0] });
    series[1].push({ minute: maxMinute, goals: cumulativeScore[1] });
    return { period, maxMinute, start, end: [...cumulativeScore], series };
  });
}
