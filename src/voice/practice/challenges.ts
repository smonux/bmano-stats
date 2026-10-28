import type { Language } from '../../i18n';
import type { EventType } from '../../domain/event-definitions';
import { practiceIds } from './context';
import { practiceNames } from './names';

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
    tip: 'Di primero a {scorer}, que marca, y después a {assistant}, que da el pase.',
    task: '{scorer} es la dorsal 7 y {assistant} la dorsal 9. Ambas son de nuestro equipo de práctica.',
    type: 'goal',
    teamId: practiceIds.own,
    primary: 7,
    related: 9,
  },
  {
    title: 'Una acción, dos equipos',
    tip: 'Primero quien comete el penalti; después quien lo provoca.',
    task: 'El dorsal 12 es de ellos. {assistant}, dorsal 9, es de nuestro equipo.',
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
  es: ['Gol', 'nuestro', `de ${practiceNames.es.scorer}`, `pase de ${practiceNames.es.assistant}`],
  en: [
    'Goal',
    'for us',
    `by ${practiceNames.en.scorer}`,
    `assisted by ${practiceNames.en.assistant}`,
  ],
  de: [
    'Tor',
    'für uns',
    `von ${practiceNames.de.scorer}`,
    `Vorlage von ${practiceNames.de.assistant}`,
  ],
  fr: [
    'But',
    'pour nous',
    `de ${practiceNames.fr.scorer}`,
    `passe décisive d’${practiceNames.fr.assistant}`,
  ],
  it: [
    'Gol',
    'nostro',
    `di ${practiceNames.it.scorer}`,
    `su assist di ${practiceNames.it.assistant}`,
  ],
  nl: [
    'Doelpunt',
    'voor ons',
    `van ${practiceNames.nl.scorer}`,
    `pass van ${practiceNames.nl.assistant}`,
  ],
  pl: ['Bramka', 'dla nas', practiceNames.pl.scorer, `asystuje ${practiceNames.pl.assistant}`],
};

/** Quoted team/role examples follow the spoken language, even in a different UI language. */
export const practiceExpressions: Record<
  Language,
  { opponent: string; assist: string; beneficiary: string }
> = {
  es: { opponent: 'ellos', assist: 'pase de', beneficiary: 'provocado por' },
  en: { opponent: 'for them', assist: 'assisted by', beneficiary: 'drawn by' },
  de: { opponent: 'für den Gegner', assist: 'Vorlage von', beneficiary: 'herausgeholt von' },
  fr: { opponent: 'pour eux', assist: 'passe décisive de', beneficiary: 'obtenu par' },
  it: { opponent: 'per loro', assist: 'assist di', beneficiary: 'procurato da' },
  nl: { opponent: 'voor de tegenstander', assist: 'pass van', beneficiary: 'uitgelokt door' },
  pl: { opponent: 'dla rywala', assist: 'asystuje', beneficiary: 'faulowana' },
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
    `Penalti cometido por ellos, número doce, provocado por ${practiceNames.es.assistant}`,
    'Exclusión de ellos',
  ],
  en: [
    'Goal for us',
    goalPhrase('en'),
    `Penalty conceded by them, number twelve, drawn by ${practiceNames.en.assistant}`,
    'Suspension for them',
  ],
  de: [
    'Tor für uns',
    goalPhrase('de'),
    `Siebenmeter verursacht vom Gegner mit der Nummer zwölf, herausgeholt von ${practiceNames.de.assistant}`,
    'Zeitstrafe für den Gegner',
  ],
  fr: [
    'But pour nous',
    goalPhrase('fr'),
    `Penalty concédé par eux, numéro douze, obtenu par ${practiceNames.fr.assistant}`,
    'Exclusion pour eux',
  ],
  it: [
    'Gol nostro',
    goalPhrase('it'),
    `Rigore causato da loro, numero dodici, procurato da ${practiceNames.it.assistant}`,
    'Esclusione per loro',
  ],
  nl: [
    'Doelpunt voor ons',
    goalPhrase('nl'),
    `Strafworp veroorzaakt door de tegenstander, nummer twaalf, uitgelokt door ${practiceNames.nl.assistant}`,
    'Tijdstraf voor de tegenstander',
  ],
  pl: [
    'Bramka dla nas',
    goalPhrase('pl'),
    `Rzut karny po faulu rywala z numerem dwanaście, faulowana ${practiceNames.pl.assistant}`,
    'Wykluczenie dla rywala',
  ],
};
