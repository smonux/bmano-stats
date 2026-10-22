import { ArrowRight, Check, Mic } from 'lucide-react';
import { tr } from '../../i18n';
export type WelcomeIllustration =
  'score' | 'recognition' | 'play' | 'perspective' | 'note' | 'timers';
export function Illustration({ kind }: { kind: WelcomeIllustration }) {
  switch (kind) {
    case 'score':
      return (
        <div className="welcome-score">
          <span>01</span>
          <b>12 : 10</b>
          <span>02</span>
        </div>
      );
    case 'recognition':
      return (
        <>
          <b>Whistle</b>
          <span>ES EN DE FR IT NL PL</span>
          <div className="welcome-wave">▂ ▅ ▃ █ ▅ ▂ ▆ ▃</div>
        </>
      );
    case 'play':
      return (
        <>
          <div className="welcome-wave">▂ ▅ ▃ █ ▅ ▂ ▆ ▃</div>
          <div className="welcome-flow">
            <Mic size={18} />
            <ArrowRight size={16} />
            <span>{tr('Gol')} · #7</span>
            <ArrowRight size={16} />
            <Check size={20} />
          </div>
        </>
      );
    case 'perspective':
      return (
        <div className="welcome-teams">
          <b>{tr('Equipo 1 (nuestro)')}</b>
          <span>{tr('Equipo 2 (rival)')}</span>
        </div>
      );
    case 'note':
      return (
        <div className="welcome-teams">
          <b>{tr('Nota del partido')}</b>
          <span>
            {tr('Tiempo')} · {tr('Minuto')}
          </span>
        </div>
      );
    case 'timers':
      return (
        <div className="welcome-timers">
          <span>
            #7<b>02:00</b>
          </span>
          <span>
            #9<b>00:38</b>
          </span>
          <span>
            #4<b>00:00</b>
          </span>
        </div>
      );
  }
}
