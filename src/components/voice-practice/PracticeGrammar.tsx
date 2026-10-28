import { languages, tr } from '../../i18n';
import type { Language } from '../../i18n';
import {
  practiceExpressions,
  practiceGoalExample,
  practicePhrases,
} from '../../voice/practice/challenges';

export function PracticeGrammar({ language }: { language: Language }) {
  const pieces = [
    ['Evento', 'Gol, parada, penalti cometido…', 'Esencial'],
    ['Equipo', 'Nuestro o de ellos, desde tu perspectiva.', 'Esencial'],
    ['Jugador 1', 'Quién realiza la acción.', 'Opcional'],
    ['Jugador 2', 'Quién asiste o provoca, según el evento.', 'Si aplica'],
  ];
  const expressions = practiceExpressions[language];
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
      <p className="caption practice-example-language">
        {tr('Ejemplos en {language}', { language: languages[language] })}
      </p>
      <div className="practice-tokens" aria-label={tr('Ejemplo de voz')} lang={language}>
        {practiceGoalExample[language].map((text, index) => (
          <span key={index}>
            <small>{tr(pieces[index][0])}</small>
            <strong>{text}</strong>
          </span>
        ))}
      </div>
      <p>{tr('Usa nombre o dorsal. Para reconocer un nombre debe estar en la plantilla.')}</p>
      <p>
        {tr('En esta práctica, «{own}» es el equipo 1 y «{other}» el equipo 2.', {
          own: practiceGoalExample[language][1],
          other: expressions.opponent,
        })}
      </p>
      <p>
        {tr(
          'Di los jugadores en ese orden. El papel del segundo depende del evento; «{assist}» y «{beneficiary}» ayudan a expresarlo.',
          { assist: expressions.assist, beneficiary: expressions.beneficiary },
        )}
      </p>
      <p className="practice-notice">
        {tr(
          'No hace falta decirlo todo. Evento y equipo bastan en estos ejemplos; puedes completar los jugadores después.',
        )}{' '}
        {tr('«{example}» ya sirve; completar después es normal.', {
          example: practicePhrases[language][0],
        })}
      </p>
    </>
  );
}
