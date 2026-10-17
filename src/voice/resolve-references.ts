import type { Snapshot } from '../domain/schema';
import type { CaptureContext } from './capture-context';
import { firstTeamWords, secondTeamWords } from './team-references';

export const normalize = (value: string) =>
  value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^\p{L}0-9]+/gu, ' ')
    .trim();
export function resolveTeam(reference: string, context: CaptureContext): string | null {
  const key = normalize(reference);
  const { match, data } = context;
  if (!key) {
    return null;
  }
  if (firstTeamWords.includes(key)) {
    return match.localTeamId;
  }
  if (secondTeamWords.includes(key)) {
    return match.visitorTeamId;
  }
  const ids = [match.localTeamId, match.visitorTeamId];
  const matches = data.teams.filter(
    (team) => ids.includes(team.id) && normalize(team.name) === key,
  );
  if (matches.length === 1) {
    return matches[0].id;
  }
  return null;
}
export function resolveDorsal(reference: string, teamId: string | null, data: Snapshot): string {
  if (!teamId) {
    return '';
  }
  const key = normalize(reference);
  const number = key.match(/^(?:(?:dorsal|numero) )?(\d{1,2})$/);
  if (number) {
    return String(Number(number[1]));
  }
  if (!key) {
    return '';
  }
  const candidates = data.players.filter(
    (player) =>
      player.teamId === teamId &&
      !player.deletedAt &&
      !player.isUnknown &&
      player.name &&
      normalize(player.name) === key,
  );
  return candidates.length === 1 ? String(candidates[0].dorsal) : '';
}
