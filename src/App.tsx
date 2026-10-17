import { AppPage } from './pages/AppPage';
import { refreshVoiceFiles } from './voice/setup';
import { Welcome, hasSeenWelcome } from './components/Welcome';
import { tr, useLanguage } from './i18n';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, BarChart3, CalendarDays, Home, Settings, Users } from 'lucide-react';
import { db } from './data/database';
import { navigate, useRoute } from './components/ui';
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
    {
      path: '/',
      label: tr('Inicio'),
      icon: Home,
    },
    {
      path: '/equipos',
      label: tr('Equipos'),
      icon: Users,
    },
    {
      path: '/partidos',
      label: tr('Partidos'),
      icon: CalendarDays,
    },
    {
      path: '/estadisticas',
      label: tr('Estadísticas'),
      icon: BarChart3,
    },
  ];

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
          {nav.map((item) => (
            <button
              key={item.path}
              className={
                (item.path === '/' ? route === '/' : route.startsWith(item.path)) ? 'current' : ''
              }
              onClick={() => navigate(item.path)}
            >
              {item.label}
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
      <main className="app-main">
        <AppPage data={data} route={route} showWelcome={() => setWelcome(true)} />
      </main>
      {welcome && <Welcome close={() => setWelcome(false)} />}
      <nav className="mobile-nav">
        {nav.map((item) => (
          <button
            key={item.path}
            className={
              (item.path === '/' ? route === '/' : route.startsWith(item.path)) ? 'current' : ''
            }
            onClick={() => navigate(item.path)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
