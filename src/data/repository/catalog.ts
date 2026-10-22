import { createId } from '../../domain/id';
import { nameKey, unknownId } from '../../domain/identity';
import type { Team, Player } from '../../domain/schema';
import type { HandballDatabase } from '../connection';
import { creationTimestamps } from './timestamps';

/** Call within a teams + players write transaction so the virtual player is atomic. */
export async function createTeamInTransaction(
  database: HandballDatabase,
  name: string,
): Promise<Team> {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 100) {
    throw new Error('Introduce un nombre de equipo de hasta 100 caracteres.');
  }
  const normalizedName = nameKey(trimmedName);
  if (await database.teams.where('nameKey').equals(normalizedName).first()) {
    throw new Error('Ya existe un equipo con ese nombre. Selecciónalo del catálogo.');
  }
  const team: Team = {
    id: createId(),
    name: trimmedName,
    nameKey: normalizedName,
    ...creationTimestamps(),
  };
  await database.teams.add(team);
  await database.players.add({
    id: unknownId(team.id),
    teamId: team.id,
    dorsal: null,
    name: 'Desconocido',
    isUnknown: true,
    ...creationTimestamps(),
  });
  return team;
}

/** Resolve/create inside the caller's transaction, including revival of a deleted player. */
export async function resolvePlayerInTransaction(
  database: HandballDatabase,
  teamId: string,
  shirtNumber: string,
) {
  if (!shirtNumber.trim()) {
    return null;
  }
  if (!/^\d{1,2}$/.test(shirtNumber.trim())) {
    throw new Error('El dorsal debe ser un número entre 0 y 99.');
  }
  const dorsal = Number(shirtNumber);
  const existingPlayer = await database.players
    .where('[teamId+dorsal]')
    .equals([teamId, dorsal])
    .first();
  if (existingPlayer) {
    if (existingPlayer.deletedAt !== null) {
      await database.players.update(existingPlayer.id, { deletedAt: null, updatedAt: Date.now() });
    }
    return existingPlayer.id;
  }
  if (!(await database.teams.get(teamId))) {
    throw new Error('No se encontró el equipo.');
  }
  const player: Player = {
    id: createId(),
    teamId,
    dorsal,
    name: '',
    isUnknown: false,
    ...creationTimestamps(),
  };
  await database.players.add(player);
  return player.id;
}

export function catalogRepository(database: HandballDatabase) {
  return {
    addTeam: (name: string) =>
      database.transaction('rw', database.teams, database.players, () =>
        createTeamInTransaction(database, name),
      ),
    async renameTeam(teamId: string, name: string) {
      return database.transaction('rw', database.teams, async () => {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length > 100) {
          throw new Error('Introduce un nombre válido.');
        }
        const team = await database.teams.get(teamId);
        if (!team) {
          throw new Error('Equipo no encontrado.');
        }
        const duplicate = await database.teams
          .where('nameKey')
          .equals(nameKey(trimmedName))
          .first();
        if (duplicate && duplicate.id !== teamId) {
          throw new Error('Ya existe otro equipo con ese nombre.');
        }
        await database.teams.update(teamId, {
          name: trimmedName,
          nameKey: nameKey(trimmedName),
          updatedAt: Date.now(),
        });
      });
    },
    async savePlayer(teamId: string, shirtNumber: string, name: string, isGoalkeeper?: boolean) {
      return database.transaction('rw', database.players, database.teams, async () => {
        const playerId = await resolvePlayerInTransaction(database, teamId, shirtNumber);
        if (!playerId) {
          throw new Error('Introduce el dorsal.');
        }
        if (name.length > 100) {
          throw new Error('El nombre no puede superar 100 caracteres.');
        }
        await database.players.update(playerId, {
          name: name.trim(),
          updatedAt: Date.now(),
          ...(isGoalkeeper === undefined ? {} : { isGoalkeeper }),
        });
      });
    },
  };
}
