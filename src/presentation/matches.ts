import { tr, getLanguage } from '../i18n';
import { type Match, type Snapshot } from '../domain/model';
import { calculate } from '../domain/statistics';

const teamName = (data: Snapshot, id: string) =>
  data.teams.find((team) => team.id === id)?.name ?? tr('Equipo');
const todayDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const formatMatchDate = (date: string) =>
  new Date(date + 'T12:00:00').toLocaleDateString(getLanguage(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const matchScore = (data: Snapshot, match: Match) => {
  const statistics = calculate([match], data.events, data.players);
  return [
    statistics.teams[match.localTeamId]?.goals ?? 0,
    statistics.teams[match.visitorTeamId]?.goals ?? 0,
  ];
};

export { teamName, todayDateString, formatMatchDate, matchScore };
