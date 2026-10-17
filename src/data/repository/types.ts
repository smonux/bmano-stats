import type { GameEvent } from '../../domain/schema';

export type TeamChoice = { id: string; name?: never } | { name: string; id?: never };
export type EventDraft = Omit<
  GameEvent,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'orderKey'
  | 'schemaVersion'
  | 'primaryPlayerId'
  | 'relatedPlayerId'
> & { id?: string; primaryDorsal: string; relatedDorsal: string; expectedUpdatedAt?: number };
