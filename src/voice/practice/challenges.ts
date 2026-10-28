import type { Language } from '../../i18n';
import type { EventType } from '../../domain/event-definitions';
import { practiceIds } from './context';

export type PracticeChallenge = {
  title: string;
  tip: string;
  task: string;
  type: EventType;
  teamId: string;
  primary?: number;
  related?: number;
  editRequired?: boolean;
};

// Expected values are consumed by evaluation, never by capture, keywords or interpretation.
export const practiceChallenges: readonly PracticeChallenge[] = [
  {
    title: 'Empieza por lo esencial',
    tip: 'El evento y el equipo bastan. No necesitas identificar al goleador.',
    task: 'Objetivo: reconocer el gol de nuestro equipo.',
    type: 'goal',
    teamId: practiceIds.own,
  },
  {
    title: 'Pon nombre a la jugada',
    tip: 'Di primero a Marta, que marca, y después a Elena, que da el pase.',
    task: 'Marta es la dorsal 7 y Elena la dorsal 9. Ambas son de nuestro equipo de práctica.',
    type: 'goal',
    teamId: practiceIds.own,
    primary: 7,
    related: 9,
  },
  {
    title: 'Una acción, dos equipos',
    tip: 'Primero quien comete el penalti; después quien lo provoca.',
    task: 'El dorsal 12 es de ellos. Elena, dorsal 9, es de nuestro equipo.',
    type: 'penalty',
    teamId: practiceIds.other,
    primary: 12,
    related: 9,
  },
  {
    title: 'Completar también cuenta',
    tip: 'La exclusión puede registrarse sin identificar al jugador.',
    task: 'Sabes que fue el dorsal 8. Añádelo en el editor después de hablar para completar el reto.',
    type: 'exclusion',
    teamId: practiceIds.other,
    primary: 8,
    editRequired: true,
  },
];

/** The introduction and challenge B share the same four spoken pieces. */
export const practiceGoalExample: Record<Language, readonly [string, string, string, string]> = {
  es: ['Gol', 'nuestro', 'de Marta', 'pase de Elena'],
  en: ['Goal', 'for us', 'by Marta', 'assisted by Elena'],
  de: ['Tor', 'für uns', 'von Marta', 'Vorlage von Elena'],
  fr: ['But', 'pour nous', 'de Marta', 'passe d’Elena'],
  it: ['Gol', 'nostro', 'di Marta', 'passaggio di Elena'],
  nl: ['Doelpunt', 'voor ons', 'van Marta', 'pass van Elena'],
  pl: ['Bramka', 'dla nas', 'Marta', 'asystuje Elena'],
};

function goalPhrase(language: Language) {
  const [event, team, scorer, assist] = practiceGoalExample[language];
  return `${event} ${team} ${scorer}, ${assist}`;
}

/** Read-aloud examples follow the selected recognition language, independently of the UI. */
export const practicePhrases: Record<Language, readonly [string, string, string, string]> = {
  es: [
    'Gol nuestro',
    goalPhrase('es'),
    'Penalti cometido por ellos, número doce, provocado por Elena',
    'Exclusión de ellos',
  ],
  en: [
    'Goal our',
    goalPhrase('en'),
    'Penalty their number twelve, drawn by Elena',
    'Suspension their',
  ],
  de: [
    'Tor unser',
    goalPhrase('de'),
    'Siebenmeter Gegner Nummer zwölf, verursacht von Elena',
    'Zeitstrafe Gegner',
  ],
  fr: [
    'But notre',
    goalPhrase('fr'),
    'Penalty commis par eux, numéro douze, provoqué par Elena',
    'Exclusion adversaire',
  ],
  it: [
    'Gol nostro',
    goalPhrase('it'),
    'Rigore loro numero dodici, provocato da Elena',
    'Esclusione loro',
  ],
  nl: [
    'Doelpunt ons',
    goalPhrase('nl'),
    'Strafworp tegenstander nummer twaalf, uitgelokt door Elena',
    'Tijdstraf tegenstander',
  ],
  pl: [
    'Bramka nasza',
    goalPhrase('pl'),
    'Rzut karny rywala numer dwanaście, sprowokowany przez Elena',
    'Wykluczenie rywala',
  ],
};
