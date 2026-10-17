import { createId } from '../../domain/id';
import { changeClock, type ClockAction } from '../../domain/clock';
import {
  assertExclusionSlot,
  changeExclusion,
  type ExclusionAction,
  type ExcludedPlayer,
} from '../../domain/exclusions';
import type { Match } from '../../domain/schema';
import type { HandballDatabase } from '../connection';
import { createTeamInTransaction } from './catalog';
import { availableMatch } from './match-access';
import { creationTimestamps } from './timestamps';
import type { TeamChoice } from './types';

async function resolveTeamChoice(database: HandballDatabase, choice: TeamChoice) {
  return choice.id
    ? database.teams.get(choice.id)
    : createTeamInTransaction(database, choice.name!);
}

export function matchesRepository(database: HandballDatabase) {
  return {
    async createMatch(ourChoice: TeamChoice, rivalChoice: TeamChoice, date: string) {
      return database.transaction(
        'rw',
        database.teams,
        database.players,
        database.matches,
        async () => {
          const ourTeam = await resolveTeamChoice(database, ourChoice);
          const rivalTeam = await resolveTeamChoice(database, rivalChoice);
          if (
            !ourTeam ||
            !rivalTeam ||
            ourTeam.deletedAt !== null ||
            rivalTeam.deletedAt !== null ||
            ourTeam.id === rivalTeam.id
          ) {
            throw new Error('Elige dos equipos distintos.');
          }
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date
          ) {
            throw new Error('Introduce una fecha válida.');
          }
          const match: Match = {
            id: createId(),
            localTeamId: ourTeam.id,
            visitorTeamId: rivalTeam.id,
            date,
            status: 'active',
            clock: { period: 1, elapsedMs: 0, startedAt: Date.now() },
            ...creationTimestamps(),
          };
          await database.matches.add(match);
          return match;
        },
      );
    },
    async clock(matchId: string, action: ClockAction) {
      return database.transaction('rw', database.matches, async () => {
        const match = await availableMatch(database, matchId);
        await database.matches.put(changeClock(match, action));
      });
    },
    async exclusion(
      matchId: string,
      slot: number,
      action: ExclusionAction,
      player?: ExcludedPlayer,
    ) {
      assertExclusionSlot(slot);
      return database.transaction('rw', database.matches, async () => {
        const match = await availableMatch(database, matchId);
        if (match.status !== 'active') {
          throw new Error('Partido no disponible.');
        }
        const now = Date.now();
        const exclusions = changeExclusion(match, slot, action, player, now);
        await database.matches.update(matchId, { exclusions, updatedAt: now });
      });
    },
    async deleteMatch(matchId: string) {
      return database.transaction('rw', database.matches, database.events, async () => {
        const match = await database.matches.get(matchId);
        if (!match) {
          return;
        }
        const stoppedMatch = match.status === 'active' ? changeClock(match, 'finish') : match;
        await database.matches.put({
          ...stoppedMatch,
          deletedAt: Date.now(),
          updatedAt: Date.now(),
        });
        await database.events
          .where('matchId')
          .equals(matchId)
          .modify({ deletedAt: Date.now(), updatedAt: Date.now() });
      });
    },
  };
}
