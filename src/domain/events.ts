import { definitions, type EventType } from './event-definitions';
import type { GameEvent, Match, Player } from './schema';

export const opponent = (match: Match, teamId: string) =>
  match.localTeamId === teamId ? match.visitorTeamId : match.localTeamId;
export const relatedTeam = (match: Match, type: EventType, teamId: string) =>
  definitions[type].sameTeam ? teamId : opponent(match, teamId);
export const chronological = (first: GameEvent, second: GameEvent) =>
  first.period - second.period ||
  first.minute - second.minute ||
  first.orderKey - second.orderKey ||
  first.id.localeCompare(second.id);

export function cleanEvent(event: GameEvent): GameEvent {
  const eventDefinition = event.type ? definitions[event.type] : null;
  const metadata: GameEvent['metadata'] = {};
  if (eventDefinition?.penalty && event.metadata.penalty !== undefined) {
    metadata.penalty = event.metadata.penalty;
  }
  if (event.type === 'disqualification' && event.metadata.blue !== undefined) {
    metadata.blue = event.metadata.blue;
  }
  if (event.type === 'infraction' && event.metadata.infraction) {
    metadata.infraction = event.metadata.infraction;
  }
  return {
    ...event,
    metadata,
    primaryPlayerId:
      event.type === 'passive' || !eventDefinition || !event.teamId ? null : event.primaryPlayerId,
    relatedPlayerId: eventDefinition?.related && event.teamId ? event.relatedPlayerId : null,
  };
}

export function eventIssues(event: GameEvent, match: Match, players: Player[]): string[] {
  const issues: string[] = [];
  const { type, teamId, primaryPlayerId, relatedPlayerId } = event;
  if (!event.type) {
    issues.push('Selecciona un evento');
  }
  if (!event.teamId || ![match.localTeamId, match.visitorTeamId].includes(event.teamId)) {
    issues.push('Selecciona un equipo');
  }
  if (event.type === 'infraction' && !event.metadata.infraction) {
    issues.push('Selecciona el tipo de infracción');
  }
  if (
    event.primaryPlayerId &&
    !players.some((player) => player.id === primaryPlayerId && player.teamId === teamId)
  ) {
    issues.push('Jugador principal de otro equipo');
  }
  if (
    relatedPlayerId &&
    type &&
    teamId &&
    !players.some(
      (player) =>
        player.id === relatedPlayerId && player.teamId === relatedTeam(match, type, teamId),
    )
  ) {
    issues.push('Jugador relacionado de otro equipo');
  }
  if (
    event.type === 'substitution' &&
    event.primaryPlayerId &&
    event.primaryPlayerId === event.relatedPlayerId &&
    players.some((player) => player.id === primaryPlayerId && !player.isUnknown)
  ) {
    issues.push('El jugador que sale y el que entra deben ser distintos.');
  }
  return issues;
}
export type EventState = 'deleted' | 'pending' | 'unidentified' | 'valid';

export function eventState(event: GameEvent, match: Match, players: Player[]): EventState {
  if (event.deletedAt !== null) {
    return 'deleted';
  }
  if (eventIssues(event, match, players).length) {
    return 'pending';
  }
  if (
    event.type !== 'passive' &&
    (!event.primaryPlayerId ||
      players.find((player) => player.id === event.primaryPlayerId)?.isUnknown)
  ) {
    return 'unidentified';
  }
  if (
    event.type === 'substitution' &&
    (!event.relatedPlayerId ||
      players.find((player) => player.id === event.relatedPlayerId)?.isUnknown)
  ) {
    return 'unidentified';
  }
  return 'valid';
}
