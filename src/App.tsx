import { refreshVoiceFiles } from './voice/setup';
import { Welcome, hasSeenWelcome } from './components/Welcome';
import { tr, useLanguage } from './i18n';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, BarChart3, CalendarDays, Home, Settings, Users } from 'lucide-react';
import { db } from './data/database';
import { Empty, PageTitle, navigate, useRoute } from './components/ui';
import { Statistics } from './components/Statistics';
import { Dashboard } from './pages/Dashboard';
import { NewMatch } from './pages/NewMatch';
import { Teams } from './pages/Teams';
import { Matches } from './pages/Matches';
import { MatchView } from './pages/MatchView';
import { SettingsView } from './pages/SettingsView';

export default function App() {
  useEffect(() => {
    void refreshVoiceFiles();
  }, []);
  const language = useLanguage();
  const [welcome, setWelcome] = useState(() => !hasSeenWelcome());
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const data = useLiveQuery(() => db.snapshot(), []);
  const route = useRoute();
  const parts = route.split('/').filter(Boolean);
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const change = () => setOffline(!navigator.onLine);
    window.addEventListener('online', change);
    window.addEventListener('offline', change);
    return () => {
      window.removeEventListener('online', change);
      window.removeEventListener('offline', change);
    };
  }, []);
  const nav = [
    { path: '/', label: tr('Inicio'), icon: Home },
    { path: '/equipos', label: tr('Equipos'), icon: Users },
    { path: '/partidos', label: tr('Partidos'), icon: CalendarDays },
    { path: '/estadisticas', label: tr('Estadísticas'), icon: BarChart3 },
  ];
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
    const m = data.matches.find((m) => m.id === parts[1] && !m.deletedAt);
    page = m ? (
      <MatchView key={m.id} data={data} match={m} />
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
    page = <SettingsView showWelcome={() => setWelcome(true)} />;
  } else {
    page = <Dashboard data={data} />;
  }
  return (
    <>
      <header className="app-header">
        <button className="brand" onClick={() => navigate('/')}>
          <span className="brand-mark">
            <Activity size={21} />
          </span>
          <span>
            handball<span className="brand-light">stats</span>
          </span>
        </button>
        <nav className="desktop-nav">
          {nav.map((n) => (
            <button
              key={n.path}
              className={
                (n.path === '/' ? route === '/' : route.startsWith(n.path)) ? 'current' : ''
              }
              onClick={() => navigate(n.path)}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className={`local-status ${offline ? 'is-offline' : ''}`}>
            <span />
            {offline ? tr('Sin conexión') : tr('En este dispositivo')}
          </span>
          <button
            aria-label={tr('Ajustes y copias de seguridad')}
            className="icon-button"
            onClick={() => navigate('/ajustes')}
          >
            <Settings size={21} />
          </button>
        </div>
      </header>
      <main className="app-main">{page}</main>
      {welcome && <Welcome close={() => setWelcome(false)} />}
      <nav className="mobile-nav">
        {nav.map((n) => (
          <button
            key={n.path}
            className={(n.path === '/' ? route === '/' : route.startsWith(n.path)) ? 'current' : ''}
            onClick={() => navigate(n.path)}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
