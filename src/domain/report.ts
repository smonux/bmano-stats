import { chronological, elapsed, eventState, type Match, type Snapshot } from './model';
import { calculate } from './statistics';

export type ScorePoint = { minute: number; goals: number; goal?: boolean };
export type PeriodTimeline = {
  period: number;
  maxMinute: number;
  start: [number, number];
  end: [number, number];
  series: [ScorePoint[], ScorePoint[]];
};
export function matchReport(data: Snapshot, matchId: string, now = Date.now()) {
  const match = data.matches.find((m) => m.id === matchId && !m.deletedAt);
  if (!match) {
    throw new Error('Partido no encontrado');
  }
  const events = data.events
    .filter((e) => e.matchId === matchId && !e.deletedAt)
    .sort(chronological);
  const stats = calculate([match], events, data.players);
  const teams = [match.localTeamId, match.visitorTeamId].map((id) =>
    data.teams.find((t) => t.id === id)!,
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
export function scoreTimelines(data: Snapshot, match: Match, now = Date.now()): PeriodTimeline[] {
  const events = data.events
    .filter((e) => e.matchId === match.id && !e.deletedAt)
    .sort(chronological);
  let score: [number, number] = [0, 0];
  return Array.from({ length: match.clock.period }, (_, i) => {
    const period = i + 1;
    const start: [number, number] = [...score];
    const inPeriod = events.filter((e) => e.period === period);
    const endMinute = Math.max(
      1,
      ...inPeriod.map((e) => e.minute),
      period === match.clock.period ? elapsed(match.clock, now) / 60000 : 0,
    );
    const maxMinute = Math.max(5, Math.ceil(endMinute / 5) * 5);
    const series: [ScorePoint[], ScorePoint[]] = [
      [{ minute: 0, goals: score[0] }],
      [{ minute: 0, goals: score[1] }],
    ];
    for (const event of inPeriod) {
      if (
        event.type !== 'goal' ||
        ['pending', 'deleted'].includes(eventState(event, match, data.players))
      ) {
        continue;
      }
      const team = event.teamId === match.localTeamId ? 0 : 1;
      series[team].push(
        { minute: event.minute, goals: score[team] },
        { minute: event.minute, goals: ++score[team], goal: true },
      );
    }
    series[0].push({ minute: maxMinute, goals: score[0] });
    series[1].push({ minute: maxMinute, goals: score[1] });
    return { period, maxMinute, start, end: [...score], series };
  });
}
