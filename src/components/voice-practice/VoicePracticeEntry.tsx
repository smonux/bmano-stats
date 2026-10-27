import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { tr } from '../../i18n';
import { navigate } from '../ui';

const preference = 'handball-voice-practice-v1';
/** Existing users keep their dismissed onboarding when upgrading. */
export function needsVoiceOnboarding() {
  try {
    return (
      !localStorage.getItem(preference) && localStorage.getItem('handball-welcome-v1') !== 'done'
    );
  } catch {
    return true;
  }
}
export function markVoicePracticeSeen(completed = false) {
  try {
    if (completed || localStorage.getItem(preference) !== 'done')
      localStorage.setItem(preference, completed ? 'done' : 'seen');
  } catch {
    /* Optional onboarding preference. */
  }
}
export function voicePracticeRoute(from = location.hash.slice(1) || '/') {
  return (
    '/practica-voz?desde=' +
    encodeURIComponent(from.startsWith('/practica-voz') ? '/ajustes' : from)
  );
}
export function voicePracticeReturn(route: string) {
  const from = new URLSearchParams(route.split('?')[1]).get('desde');
  return from &&
    /^\/(?:ajustes|nuevo|partidos(?:\/[^/?#]+)?|equipos(?:\/[^/?#]+)?|estadisticas)?$/.test(from)
    ? from
    : '/ajustes';
}
export function VoicePracticeEntry({ always = false }: { always?: boolean }) {
  const [visible, setVisible] = useState(() => {
    try {
      return always || !localStorage.getItem(preference);
    } catch {
      return true;
    }
  });
  if (!visible) return null;
  return (
    <aside className="practice-invite">
      <p>{tr('Aprende la fórmula y prueba cuatro jugadas con equipos ficticios.')}</p>
      <div className="actions">
        <button
          type="button"
          data-voice-practice-entry
          onClick={() => navigate(voicePracticeRoute())}
        >
          <GraduationCap size={20} aria-hidden="true" />
          {tr('Practicar voz')}
        </button>
        {!always && (
          <button
            type="button"
            onClick={() => {
              markVoicePracticeSeen();
              setVisible(false);
            }}
          >
            {tr('Ahora no')}
          </button>
        )}
      </div>
    </aside>
  );
}
