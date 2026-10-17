/** Public domain API. Implementations live in the modules named by their responsibility. */
export { eventTypes, definitions, type EventType, type EventDefinition } from './event-definitions';
export {
  teamSchema,
  playerSchema,
  clockSchema,
  exclusionSchema,
  matchSchema,
  metadataSchema,
  eventSchema,
  backupSchema,
  type Team,
  type Player,
  type Match,
  type Clock,
  type GameEvent,
  type Snapshot,
  type Backup,
} from './schema';
export { unknownId, nameKey } from './identity';
export {
  opponent,
  relatedTeam,
  chronological,
  cleanEvent,
  eventIssues,
  eventState,
  type EventState,
} from './events';
export { elapsed, changeClock, type ClockAction } from './clock';
export { validateBackup } from './backup';
