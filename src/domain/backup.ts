import {
  backupInputSchema,
  type Backup,
  type GameEvent,
  type Match,
  type Player,
  type Team,
} from './schema';
import { nameKey, unknownId } from './identity';
import { cleanEvent, relatedTeam } from './events';
import { migrateLegacyExclusions } from './legacy-exclusions';

/** Parse the file contract first, then validate identities and cross-collection references. */
export function validateBackup(input: unknown): Backup {
  const data = backupInputSchema.parse(input);
  assertUniqueIds([data.teams, data.players, data.matches, data.events]);
  const teamsById = new Map(data.teams.map((team) => [team.id, team]));
  const playersById = new Map(data.players.map((player) => [player.id, player]));
  const matchesById = new Map(data.matches.map((match) => [match.id, match]));
  validateTeams(data.teams, playersById);
  validatePlayers(data.players, teamsById);
  for (const match of data.matches) {
    validateMatch(match, teamsById, playersById);
    if (
      data.version === 2 &&
      match.exclusions?.some((timer) => timer && timer.running !== (match.status === 'active'))
    ) {
      throw new Error('Temporizador de exclusión inválido.');
    }
  }
  for (const event of data.events) {
    validateEvent(event, matchesById, playersById);
  }
  return {
    ...data,
    version: 2,
    matches:
      data.version === 1
        ? data.matches.map((match) => migrateLegacyExclusions(match))
        : data.matches,
  };
}

function assertUniqueIds(collections: readonly (readonly { id: string }[])[]) {
  for (const collection of collections) {
    const ids = new Set(collection.map((entity) => entity.id));
    if (ids.size !== collection.length) {
      throw new Error('La copia contiene identificadores duplicados.');
    }
  }
}

function validateTeams(teams: Team[], playersById: ReadonlyMap<string, Player>) {
  const usedNameKeys = new Set<string>();
  for (const team of teams) {
    if (team.nameKey !== nameKey(team.name) || usedNameKeys.has(team.nameKey)) {
      throw new Error('Los nombres de equipo no son únicos o válidos.');
    }
    usedNameKeys.add(team.nameKey);
    const unknownPlayer = playersById.get(unknownId(team.id));
    if (
      !unknownPlayer?.isUnknown ||
      unknownPlayer.teamId !== team.id ||
      unknownPlayer.dorsal !== null ||
      unknownPlayer.deletedAt !== null
    ) {
      throw new Error('Falta el jugador virtual de un equipo.');
    }
  }
}

function validatePlayers(players: Player[], teamsById: ReadonlyMap<string, Team>) {
  const usedShirtNumbers = new Set<string>();
  for (const player of players) {
    const invalidNumber = player.isUnknown
      ? player.id !== unknownId(player.teamId) || player.dorsal !== null
      : player.dorsal === null;
    if (
      !teamsById.has(player.teamId) ||
      invalidNumber ||
      (player.isUnknown && player.isGoalkeeper)
    ) {
      throw new Error('Jugador o equipo inválido en la copia.');
    }
    const teamAndNumber = `${player.teamId}:${player.dorsal}`;
    if (usedShirtNumbers.has(teamAndNumber)) {
      throw new Error('La copia contiene dorsales duplicados.');
    }
    usedShirtNumbers.add(teamAndNumber);
  }
}

function validateMatch(
  match: Match,
  teamsById: ReadonlyMap<string, Team>,
  playersById: ReadonlyMap<string, Player>,
) {
  for (const [teamId, playerId] of Object.entries(match.lastGoalkeepers ?? {})) {
    const player = playersById.get(playerId);
    if (
      ![match.localTeamId, match.visitorTeamId].includes(teamId) ||
      !player ||
      player.teamId !== teamId ||
      player.isUnknown
    ) {
      throw new Error('Portero recordado inválido en la copia.');
    }
  }
  for (const timer of match.exclusions ?? []) {
    if (
      timer &&
      (![match.localTeamId, match.visitorTeamId].includes(timer.teamId) ||
        (timer.startedAt !== null &&
          (!timer.running || match.clock.startedAt === null || match.status === 'done')))
    ) {
      throw new Error('Temporizador de exclusión inválido.');
    }
  }
  const invalidTeams =
    !teamsById.has(match.localTeamId) ||
    !teamsById.has(match.visitorTeamId) ||
    match.localTeamId === match.visitorTeamId;
  const finishedWithRunningClock = match.status === 'done' && match.clock.startedAt !== null;
  if (invalidTeams || finishedWithRunningClock) {
    throw new Error('Partido inválido en la copia.');
  }
  if (new Date(match.date + 'T12:00:00Z').toISOString().slice(0, 10) !== match.date) {
    throw new Error('Fecha de partido inválida.');
  }
}

function validateEvent(
  event: GameEvent,
  matchesById: ReadonlyMap<string, Match>,
  playersById: ReadonlyMap<string, Player>,
) {
  const match = matchesById.get(event.matchId);
  if (
    !match ||
    (event.teamId !== null && ![match.localTeamId, match.visitorTeamId].includes(event.teamId))
  ) {
    throw new Error('Evento con referencias inválidas.');
  }
  if (event.period > match.clock.period) {
    throw new Error('Evento fuera de los tiempos del partido.');
  }
  if (event.primaryPlayerId && playersById.get(event.primaryPlayerId)?.teamId !== event.teamId) {
    throw new Error('Jugador principal inválido.');
  }
  if (
    event.relatedPlayerId &&
    (!event.type ||
      !event.teamId ||
      playersById.get(event.relatedPlayerId)?.teamId !==
        relatedTeam(match, event.type, event.teamId))
  ) {
    throw new Error('Jugador relacionado inválido.');
  }
  const compatibleEvent = cleanEvent(event);
  if (
    JSON.stringify(compatibleEvent.metadata) !== JSON.stringify(event.metadata) ||
    compatibleEvent.teamId !== event.teamId ||
    compatibleEvent.primaryPlayerId !== event.primaryPlayerId ||
    compatibleEvent.relatedPlayerId !== event.relatedPlayerId
  ) {
    throw new Error('Evento con campos incompatibles.');
  }
}
