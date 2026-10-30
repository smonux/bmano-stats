import { useEffect, useRef, type RefObject } from 'react';
import {
  BarChart3,
  CalendarDays,
  Home,
  LockKeyhole,
  Settings,
  Smartphone,
  Users,
  X,
  GraduationCap,
} from 'lucide-react';
import { tr } from '../i18n';
import { buildInfo } from '../build-info';
import { voicePracticeRoute } from './voice-practice/VoicePracticeEntry';
const destinations = [
  {
    path: '/',
    label: 'Inicio',
    icon: Home,
  },
  {
    path: '/equipos',
    label: 'Equipos',
    icon: Users,
  },
  {
    path: '/partidos',
    label: 'Partidos',
    icon: CalendarDays,
  },
  {
    path: '/estadisticas',
    label: 'Estadísticas',
    icon: BarChart3,
  },
  {
    path: '/ajustes',
    label: 'Ajustes',
    icon: Settings,
  },
  { path: '/practica-voz', label: 'Practicar voz', icon: GraduationCap },
];
export function NavigationDrawer({
  route,
  close,
  portrait,
  trigger,
}: {
  route: string;
  close: () => void;
  portrait: {
    locked: boolean;
    requestLock: () => Promise<void>;
  };
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = drawer.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [trigger]);
  return (
    <dialog
      ref={drawer}
      id="main-navigation"
      className="navigation-drawer"
      aria-label={tr('Menú principal')}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX > bounds.right || event.clientY > bounds.bottom) {
          close();
        }
      }}
    >
      <div className="drawer-heading">
        <h2>{tr('Menú principal')}</h2>
        <button className="icon-button" aria-label={tr('Cerrar menú')} onClick={close}>
          <X size={22} />
        </button>
      </div>
      <nav>
        {destinations.map(({ path, label, icon: Icon }) => (
          <a
            key={path}
            href={`#${path === '/practica-voz' ? voicePracticeRoute(route) : path}`}
            onClick={close}
            aria-current={
              (path === '/' ? route === '/' : route.startsWith(path)) ? 'page' : undefined
            }
          >
            <Icon size={21} />
            {tr(label)}
          </a>
        ))}
      </nav>
      <button
        className="portrait-control"
        aria-pressed={portrait.locked}
        disabled={portrait.locked}
        onClick={() => {
          close();
          void portrait.requestLock();
        }}
      >
        {portrait.locked ? <LockKeyhole size={20} /> : <Smartphone size={20} />}
        {tr(portrait.locked ? 'Orientación vertical fijada' : 'Fijar vertical')}
      </button>
      <div className="drawer-build" role="group" aria-label={tr('Versión de la aplicación')}>
        <span>v{buildInfo.version}</span>
        <small>
          commit <code>{buildInfo.commit}</code>
        </small>
      </div>
    </dialog>
  );
}
