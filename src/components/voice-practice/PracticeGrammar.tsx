import { tr } from '../../i18n';
import type { Language } from '../../i18n';

export function PracticeGrammar({ language }: { language: Language }) {
  const pieces = [
    ['Evento', 'Gol, parada, penalti cometido…', 'Esencial'],
    ['Equipo', 'Nuestro o de ellos, desde tu perspectiva.', 'Esencial'],
    ['Jugador 1', 'Quién realiza la acción.', 'Opcional'],
    ['Jugador 2', 'Quién asiste o provoca, según el evento.', 'Si aplica'],
  ];
  const examples: Record<Language, string[]> = {
    es: ['Gol', 'nuestro', 'de Marta', 'pase de la 15'],
    en: ['Goal', 'our', 'by Marta', 'pass from number 15'],
    de: ['Tor', 'unser', 'von Marta', 'Vorlage von Nummer 15'],
    fr: ['But', 'notre', 'de Marta', 'passe de la 15'],
    it: ['Gol', 'nostro', 'di Marta', 'passaggio della 15'],
    nl: ['Doelpunt', 'ons', 'van Marta', 'pass van nummer 15'],
    pl: ['Bramka', 'nasza', 'Marta', 'podanie numer 15'],
  };
  return (
    <>
      <p className="eyebrow">{tr('ANTES DE HABLAR')}</p>
      <h1 tabIndex={-1}>{tr('Una jugada. Cuatro piezas.')}</h1>
      <p>{tr('Di qué ha pasado y de qué equipo. Después, añade quién intervino.')}</p>
      <ol className="practice-grammar">
        {pieces.map(([label, description, tag], index) => (
          <li key={label}>
            <span className="practice-number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong>{tr(label)}</strong>
              <small>{tr(description)}</small>
            </div>
            <span className="practice-tag">{tr(tag)}</span>
          </li>
        ))}
      </ol>
      <div className="practice-tokens" aria-label={tr('Ejemplo de voz')} lang={language}>
        {examples[language].map((text, index) => (
          <span key={index}>
            <small>{tr(pieces[index][0])}</small>
            <strong>{text}</strong>
          </span>
        ))}
      </div>
      <p>{tr('Usa nombre o dorsal. Para reconocer un nombre debe estar en la plantilla.')}</p>
      <p>{tr('En esta práctica, «nuestro» es el equipo 1 y «ellos» el equipo 2.')}</p>
      <p>
        {tr(
          'Di los jugadores en ese orden. El papel del segundo depende del evento; «pase de» y «provocado por» ayudan a expresarlo.',
        )}
      </p>
      <p className="practice-notice">
        {tr(
          'No hace falta decirlo todo. Evento y equipo bastan en estos ejemplos; puedes completar los jugadores después.',
        )}{' '}
        {tr('«{example}» ya sirve; completar después es normal.', {
          example: examples[language].slice(0, 2).join(' '),
        })}
      </p>
    </>
  );
}
