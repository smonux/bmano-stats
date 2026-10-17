import { tr } from '../i18n';
import { ChevronRight } from 'lucide-react';
import { type Match, type Snapshot } from '../domain/model';
import { navigate } from './ui';
import { teamName, formatMatchDate, matchScore } from '../presentation/matches';

function MatchCard({ data, match }: { data: Snapshot; match: Match }) {
  const [a, b] = matchScore(data, match);
  return (
    <button className="match-card" onClick={() => navigate(`/partidos/${match.id}`)}>
      <div className="match-card-top">
        <span>{formatMatchDate(match.date)}</span>
        <span className={`badge ${match.status === 'active' ? 'live' : ''}`}>
          {match.status === 'active' ? tr('En curso') : tr('Finalizado')}
        </span>
      </div>
      <div className="match-card-score">
        <div>
          <span>{teamName(data, match.localTeamId)}</span>
          <span>{teamName(data, match.visitorTeamId)}</span>
        </div>
        <div className="score-small">
          <strong>{a}</strong>
          <strong>{b}</strong>
        </div>
        <ChevronRight size={20} />
      </div>
    </button>
  );
}

export { MatchCard };
