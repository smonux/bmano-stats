import { z } from 'zod';
import { eventTypes } from './event-definitions';
import { EXCLUSION_DURATION_MS, EXCLUSION_SLOT_COUNT } from './exclusions';

const id = z.string().min(1).max(100);
const stamp = z.number().finite().nonnegative();
const base = { id, createdAt: stamp, updatedAt: stamp, deletedAt: stamp.nullable() };
export const teamSchema = z.object({
  ...base,
  name: z.string().trim().min(1).max(100),
  nameKey: z.string().min(1),
});
export const playerSchema = z.object({
  ...base,
  teamId: id,
  dorsal: z.number().int().min(0).max(99).nullable(),
  name: z.string().max(100),
  isUnknown: z.boolean(),
  isGoalkeeper: z.boolean().optional(),
});
export const clockSchema = z.object({
  period: z.number().int().min(1),
  elapsedMs: stamp,
  startedAt: stamp.nullable(),
});
export const exclusionSchema = z.object({
  id,
  teamId: id,
  dorsal: z.number().int().min(0).max(99).nullable(),
  remainingMs: z.number().min(0).max(EXCLUSION_DURATION_MS),
  running: z.boolean(),
  startedAt: stamp.nullable(),
});
export const matchSchema = z.object({
  ...base,
  localTeamId: id,
  visitorTeamId: id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['active', 'done']),
  clock: clockSchema,
  exclusions: z.array(exclusionSchema.nullable()).length(EXCLUSION_SLOT_COUNT).optional(),
  lastGoalkeepers: z.record(id, id).optional(),
});
export const metadataSchema = z.object({
  penalty: z.boolean().optional(),
  blue: z.boolean().optional(),
  infraction: z.enum(['Pasos', 'Dobles', 'Pisando']).optional(),
});
export const eventSchema = z.object({
  ...base,
  schemaVersion: z.literal(1),
  matchId: id,
  type: z.enum(eventTypes).nullable(),
  teamId: id.nullable(),
  primaryPlayerId: id.nullable(),
  relatedPlayerId: id.nullable(),
  period: z.number().int().min(1),
  minute: z.number().int().min(0).max(999),
  orderKey: z.number().int().nonnegative(),
  metadata: metadataSchema,
  rawText: z.string().max(10000),
  note: z.string().max(10000),
});
export type Team = z.infer<typeof teamSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Match = z.infer<typeof matchSchema>;
export type Clock = z.infer<typeof clockSchema>;
export type GameEvent = z.infer<typeof eventSchema>;
export type Snapshot = { teams: Team[]; players: Player[]; matches: Match[]; events: GameEvent[] };
export const backupSchema = z.object({
  format: z.literal('handball-stats'),
  version: z.literal(2),
  exportedAt: stamp,
  teams: z.array(teamSchema),
  players: z.array(playerSchema),
  matches: z.array(matchSchema),
  events: z.array(eventSchema),
});
export type Backup = z.infer<typeof backupSchema>;
const legacyBackupSchema = backupSchema.extend({
  version: z.literal(1),
  matches: z.array(
    matchSchema.extend({
      exclusions: z.array(exclusionSchema.nullable()).length(3).optional(),
    }),
  ),
});
export const backupInputSchema = z.discriminatedUnion('version', [
  legacyBackupSchema,
  backupSchema,
]);
