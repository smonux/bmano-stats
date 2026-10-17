import { eventState, opponent, relatedTeam } from './events';
import { unknownId } from './identity';
import type { EventType } from './event-definitions';
import type { GameEvent, Match, Player } from './schema';
import { emptyStats, type Metric, type Stats } from './statistics/metrics';

export {
  metrics,
  labels,
  emptyStats,
  efficacy,
  type Metric,
  type Stats,
} from './statistics/metrics';
export type CalculatedStatistics = { teams: Record<string, Stats>; players: Record<string, Stats> };
type CountableEvent = GameEvent & { type: EventType; teamId: string };

function canCount(event: GameEvent, match: Match, players: Player[]): event is CountableEvent {
  return (
    !['pending', 'deleted'].includes(eventState(event, match, players)) &&
    !!event.type &&
    !!event.teamId
  );
}

function increment(target: Record<string, Stats>, entityId: string, ...metrics: Metric[]) {
  const stats = (target[entityId] ??= emptyStats());
  for (const metric of metrics) {
    stats[metric]++;
  }
}

export function calculate(
  matches: Match[],
  events: GameEvent[],
  players: Player[],
): CalculatedStatistics {
  const result: CalculatedStatistics = { teams: {}, players: {} };
  const matchesById = new Map(
    matches.filter((match) => match.deletedAt === null).map((match) => [match.id, match]),
  );
  for (const event of events) {
    const match = matchesById.get(event.matchId);
    if (match && canCount(event, match, players)) {
      countEvent(result, event, match, players);
    }
  }
  return result;
}

/** Derived consequences stay here; they do not create extra events in the database. */
function countEvent(
  result: CalculatedStatistics,
  event: CountableEvent,
  match: Match,
  players: Player[],
) {
  const eventTeamId = event.teamId;
  const opposingTeamId = opponent(match, eventTeamId);
  const primaryPlayerId = event.primaryPlayerId ?? unknownId(eventTeamId);
  const relatedPlayerId =
    event.relatedPlayerId ?? unknownId(relatedTeam(match, event.type, eventTeamId));
  const eventTeamAndPlayer = (...metrics: Metric[]) => {
    for (const metric of metrics) {
      increment(result.teams, eventTeamId, metric);
      increment(result.players, primaryPlayerId, metric);
    }
  };
  const opposingTeam = (...metrics: Metric[]) =>
    increment(result.teams, opposingTeamId, ...metrics);

  switch (event.type) {
    case 'substitution':
      increment(result.teams, eventTeamId, 'substitutions');
      increment(result.players, primaryPlayerId, 'substitutionsOut');
      increment(result.players, relatedPlayerId, 'substitutionsIn');
      break;
    case 'goal':
      eventTeamAndPlayer('goals', 'shots');
      opposingTeam('goalsReceived', 'shotsReceived');
      if (event.relatedPlayerId) {
        increment(result.players, relatedPlayerId, 'assists');
      }
      if (event.metadata.penalty) {
        eventTeamAndPlayer('penaltyGoals');
      }
      break;
    case 'save':
      eventTeamAndPlayer('saves');
      increment(result.teams, eventTeamId, 'shotsReceived');
      opposingTeam('shots', 'misses');
      increment(result.players, relatedPlayerId, 'shots', 'misses');
      if (event.metadata.penalty) {
        eventTeamAndPlayer('penaltySaves');
        opposingTeam('penaltyMisses');
        increment(result.players, relatedPlayerId, 'penaltyMisses');
      }
      break;
    case 'miss':
      eventTeamAndPlayer('shots', 'misses');
      opposingTeam('shotsReceived');
      if (event.metadata.penalty) {
        eventTeamAndPlayer('penaltyMisses');
      }
      break;
    case 'loss':
      eventTeamAndPlayer('losses');
      break;
    case 'recovery':
      eventTeamAndPlayer('recoveries');
      opposingTeam('losses');
      increment(result.players, relatedPlayerId, 'losses');
      break;
    case 'penalty':
      eventTeamAndPlayer('penalties');
      opposingTeam('penaltiesReceived');
      break;
    case 'exclusion':
      eventTeamAndPlayer('exclusions');
      if (
        event.relatedPlayerId &&
        !players.find((player) => player.id === relatedPlayerId)?.isUnknown
      ) {
        increment(result.players, relatedPlayerId, 'forcedExclusions');
      }
      break;
    case 'yellow':
      eventTeamAndPlayer('yellow');
      break;
    case 'disqualification':
      eventTeamAndPlayer('disqualifications');
      if (event.metadata.blue) {
        eventTeamAndPlayer('blue');
      }
      break;
    case 'passive':
      increment(result.teams, eventTeamId, 'passives');
      break;
    case 'infraction':
      eventTeamAndPlayer('infractions', 'losses', event.metadata.infraction!);
      break;
  }
}
