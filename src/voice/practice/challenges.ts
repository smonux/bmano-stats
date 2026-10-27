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
    tip: 'Di primero a Marta, que marca, y después a quien da el pase.',
    task: 'Marta es la dorsal 7 y la asistente lleva el 15. Ambas son de nuestro equipo de práctica.',
    type: 'goal',
    teamId: practiceIds.own,
    primary: 7,
    related: 15,
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

/** Read-aloud examples follow the selected recognition language, independently of the UI. */
export const practicePhrases: Record<Language, readonly [string, string, string, string]> = {
  es: [
    'Gol nuestro',
    'Gol nuestro de Marta, pase de la quince',
    'Penalti cometido por ellos, número doce, provocado por Elena',
    'Exclusión de ellos',
  ],
  en: [
    'Goal our',
    'Goal our by Marta, pass from number fifteen',
    'Penalty their number twelve, drawn by Elena',
    'Suspension their',
  ],
  de: [
    'Tor unser',
    'Tor unser von Marta, Vorlage von Nummer fünfzehn',
    'Siebenmeter Gegner Nummer zwölf, verursacht von Elena',
    'Zeitstrafe Gegner',
  ],
  fr: [
    'But notre',
    'But notre de Marta, passe de la quinze',
    'Penalty commis par eux, numéro douze, provoqué par Elena',
    'Exclusion adversaire',
  ],
  it: [
    'Gol nostro',
    'Gol nostro di Marta, passaggio della quindici',
    'Rigore loro numero dodici, provocato da Elena',
    'Esclusione loro',
  ],
  nl: [
    'Doelpunt ons',
    'Doelpunt ons van Marta, pass van nummer vijftien',
    'Strafworp tegenstander nummer twaalf, uitgelokt door Elena',
    'Tijdstraf tegenstander',
  ],
  pl: [
    'Bramka nasza',
    'Bramka nasza Marta, podanie numer piętnaście',
    'Rzut karny rywala numer dwanaście, sprowokowany przez Elena',
    'Wykluczenie rywala',
  ],
};
