import type { Snapshot } from '../domain/schema';
import { Empty, PageTitle, navigate } from '../components/ui';
import { Statistics } from '../components/Statistics';
import { tr } from '../i18n';
import { Dashboard } from './Dashboard';
import { NewMatch } from './NewMatch';
import { Teams } from './Teams';
import { Matches } from './Matches';
import { MatchView } from './MatchView';
import { SettingsView } from './SettingsView';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/database';
import { VoicePractice } from './VoicePractice';

/** A route can advance before the live snapshot delivers a newly committed match. */
function MatchRoute({ id, data }: { id: string; data: Snapshot }) {
  const present = data.matches.some((item) => item.id === id && !item.deletedAt);
  const resolved = useLiveQuery(() => (present ? data : db.snapshot()), [id, data, present]);
  const fresh = present ? data : resolved;
  if (!fresh)
    return (
      <div className="empty" role="status">
        {tr('Abriendo tus datos…')}
      </div>
    );
  const match = fresh.matches.find((item) => item.id === id && !item.deletedAt);
  return match ? (
    <MatchView key={id} data={fresh} match={match} />
  ) : (
    <Empty title={tr('Partido no encontrado')}>
      <button onClick={() => navigate('/partidos')}>{tr('Ver partidos')}</button>
    </Empty>
  );
}

export function AppPage({ data, route }: { data: Snapshot | undefined; route: string }) {
  const parts = route.split('?')[0].split('/').filter(Boolean);
  let page;
  if (!data) {
    page = (
      <div className="empty" role="status">
        {tr('Abriendo tus datos…')}
      </div>
    );
  } else if (parts[0] === 'practica-voz') {
    page = (
      <VoicePractice
        route={route}
        live={data.matches.some((match) => !match.deletedAt && match.status === 'active')}
      />
    );
  } else if (parts[0] === 'nuevo') {
    page = <NewMatch data={data} />;
  } else if (parts[0] === 'equipos') {
    page = <Teams key={parts[1] ?? 'list'} data={data} id={parts[1]} />;
  } else if (parts[0] === 'partidos' && parts[1]) {
    page = <MatchRoute key={parts[1]} id={parts[1]} data={data} />;
  } else if (parts[0] === 'partidos') {
    page = <Matches data={data} />;
  } else if (parts[0] === 'estadisticas') {
    page = (
      <>
        <PageTitle
          title={tr('Estadísticas')}
          subtitle={tr('Una vista clara de lo que ocurre en pista.')}
        />
        <section className="panel">
          <Statistics data={data} />
        </section>
      </>
    );
  } else if (parts[0] === 'ajustes') {
    page = <SettingsView />;
  } else {
    page = <Dashboard data={data} />;
  }
  return page;
}
