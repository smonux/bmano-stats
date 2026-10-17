import type { SpokenEvent } from '../event-types';

export type ParticipantRelation = {
  /** Introduces the related player: «asistencia de Ana». */
  after: string;
  /** Follows the related player: «Ana asistió». */
  before: string;
};
export type Infraction = 'Pasos' | 'Dobles' | 'Pisando';

/** Patterns match normalized whole words. Literal, fuzzy and ASR vocabularies differ deliberately. */
export type LanguageRules = {
  events: Record<SpokenEvent, string>;
  approximateAliases: Record<SpokenEvent, readonly string[]>;
  whistleKeywords: readonly string[];
  substitution: { noun: string; out: string; in: string; connector: string; irrelevant: string };
  own: string;
  opponent: string;
  shirt: string;
  penalty: string;
  committed: string;
  blue: string;
  infraction: Record<Infraction, string>;
  relation: Partial<Record<SpokenEvent, ParticipantRelation>>;
  destination: string;
  negation: string;
  missNegation: string;
  cancelled: string;
  uncertain: string;
  question: string;
  warningOnly: string;
  correction: string;
  timePrefix: string;
  units: string;
  stopWords: readonly string[];
  context: { clothes: string; card: string; score: string; remaining: string; suspension: string };
  confirmedSanction: string;
  committingVerbs: string;
  recipientPrepositions: readonly string[];
  articles: readonly string[];
  numbers: {
    units: readonly string[];
    teens: readonly string[];
    tens: readonly string[];
    shirtMarker: string;
  };
};

/** Join named alternatives without changing their priority or regular-expression grouping. */
export const patterns = (...alternatives: string[]): string => alternatives.join('|');
