import { tr } from '../i18n';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { type Snapshot } from '../domain/model';
import { Empty, PageTitle, navigate } from '../components/ui';
import { teamName } from '../presentation/matches';
import { MatchCard } from '../components/MatchCard';

function Matches({ data }: { data: Snapshot }) {
  const [query, setQuery] = useState('');
  const matches = data.matches
    .filter(
      (m) =>
        !m.deletedAt &&
        `${teamName(data, m.localTeamId)} ${teamName(data, m.visitorTeamId)}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.status === 'active') - Number(a.status === 'active') ||
        b.date.localeCompare(a.date) ||
        b.createdAt - a.createdAt,
    );
  return (
    <>
      <PageTitle title={tr('Partidos')} subtitle={tr('Cada encuentro, a mano.')} />
      <div className="search-field">
        <Search size={19} />
        <input
          aria-label={tr('Buscar partido por equipo')}
          placeholder={tr('Buscar equipo…')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {matches.length ? (
        <div className="match-grid">
          {matches.map((m) => (
            <MatchCard key={m.id} data={data} match={m} />
          ))}
        </div>
      ) : (
        <Empty title={tr('Todavía no hay partidos')}>
          <p>{tr('Crea un encuentro para empezar a registrar.')}</p>
          <button className="primary" onClick={() => navigate('/nuevo')}>
            {tr('Nuevo partido')}
          </button>
        </Empty>
      )}
    </>
  );
}

export { Matches };
