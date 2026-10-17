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

export function AppPage({
  data,
  route,
  showWelcome,
}: {
  data: Snapshot | undefined;
  route: string;
  showWelcome: () => void;
}) {
  const parts = route.split('/').filter(Boolean);
  let page;
  if (!data) {
    page = (
      <div className="empty" role="status">
        {tr('Abriendo tus datos…')}
      </div>
    );
  } else if (parts[0] === 'nuevo') {
    page = <NewMatch data={data} />;
  } else if (parts[0] === 'equipos') {
    page = <Teams key={parts[1] ?? 'list'} data={data} id={parts[1]} />;
  } else if (parts[0] === 'partidos' && parts[1]) {
    const match = data.matches.find((match) => match.id === parts[1] && !match.deletedAt);
    page = match ? (
      <MatchView key={match.id} data={data} match={match} />
    ) : (
      <Empty title={tr('Partido no encontrado')}>
        <button onClick={() => navigate('/partidos')}>{tr('Ver partidos')}</button>
      </Empty>
    );
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
    page = <SettingsView showWelcome={showWelcome} />;
  } else {
    page = <Dashboard data={data} />;
  }
  return page;
}
