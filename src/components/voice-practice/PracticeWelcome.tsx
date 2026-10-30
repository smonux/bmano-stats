import { Hand, Mic } from 'lucide-react';
import { tr } from '../../i18n';

export function PracticeWelcome() {
  return (
    <div className="practice-welcome">
      <p className="eyebrow">Handball Stats</p>
      <h1 tabIndex={-1}>{tr('Registra el partido por voz y gestos.')}</h1>
      <p>
        {tr(
          'Una aplicación para registrar los eventos de un partido de balonmano mientras ocurre.',
        )}
      </p>
      <ul className="practice-methods">
        <li>
          <Mic size={28} aria-hidden="true" />
          <div>
            <strong>{tr('Con la voz')}</strong>
            <p>{tr('Mantén pulsado para decir la jugada y suelta para revisarla.')}</p>
          </div>
        </li>
        <li>
          <Hand size={28} aria-hidden="true" />
          <div>
            <strong>{tr('Con gestos y toques')}</strong>
            <p>
              {tr(
                'Elige eventos y jugadores en pantalla y desliza las ruedas para ajustar los datos.',
              )}
            </p>
          </div>
        </li>
      </ul>
      <p className="practice-notice">
        {tr(
          'La práctica te enseña qué decir y cómo revisar cada jugada para introducir los datos con más precisión durante el partido.',
        )}
      </p>
    </div>
  );
}
