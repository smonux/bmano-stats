import { NavigationDrawer } from './components/NavigationDrawer';
import { usePortraitOrientation } from './hooks/usePortraitOrientation';
import { useMatchTimeLimit } from './hooks/useMatchTimeLimit';
import { AppPage } from './pages/AppPage';
import { restoreVoice } from './voice/setup';
import { Welcome, hasSeenWelcome } from './components/Welcome';
import { tr, useLanguage } from './i18n';
import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Menu, X } from 'lucide-react';
import { db } from './data/database';
import { ErrorMessage, navigate, useRoute } from './components/ui';
export default function App() {
  useEffect(() => {
    void restoreVoice();
  }, []);
  const language = useLanguage();
  const [welcome, setWelcome] = useState(() => !hasSeenWelcome());
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const data = useLiveQuery(() => db.snapshot(), []);
  const timeLimitError = useMatchTimeLimit(data?.matches);
  const route = useRoute();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const portrait = usePortraitOrientation();
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

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <button
            ref={menuButton}
            className="icon-button menu-button"
            aria-label={tr('Abrir menú')}
            aria-expanded={navigationOpen}
            aria-controls="main-navigation"
            onClick={() => setNavigationOpen(true)}
          >
            <Menu size={24} />
          </button>
          <button className="brand" onClick={() => navigate('/')}>
            <span className="brand-mark">
              <img src="/icon.svg" alt="" width="37" height="37" />
            </span>
            <span>
              handball<span className="brand-light">stats</span>
            </span>
          </button>
        </div>
        <div className="header-right">
          <span className={`local-status ${offline ? 'is-offline' : ''}`}>
            <span />
            {offline ? tr('Sin conexión') : tr('En este dispositivo')}
          </span>
        </div>
      </header>
      {navigationOpen && (
        <NavigationDrawer
          trigger={menuButton}
          route={route}
          close={() => setNavigationOpen(false)}
          portrait={portrait}
        />
      )}
      <main className="app-main">
        <ErrorMessage text={timeLimitError} />
        {portrait.notice && (
          <div className="orientation-notice" role="status">
            <p>{portrait.notice}</p>
            <button
              className="icon-button"
              aria-label={tr('Cerrar')}
              onClick={portrait.dismissNotice}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <AppPage data={data} route={route} showWelcome={() => setWelcome(true)} />
      </main>
      {welcome && <Welcome close={() => setWelcome(false)} />}
    </>
  );
}
