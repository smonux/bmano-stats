import type { Language } from '../../i18n';
import type { SpokenEvent } from '../event-types';
import type { LanguageRules } from '../languages/types';

export type TeamPerspective = 'equipo1' | 'equipo2';
export type RulePlayer = { name: string; team: TeamPerspective; dorsal?: number | null };

/** Public proposal keys are Spanish to preserve the dataset and editor contract. */
export type RuleProposal = {
  evento: SpokenEvent | 'desconocido';
  equipo: TeamPerspective | 'desconocido';
  dorsal?: number;
  nombre?: string;
  dorsal_relacionado?: number;
  nombre_relacionado?: string;
  penalti?: boolean;
  azul?: boolean;
  infraccion?: 'Pasos' | 'Dobles' | 'Pisando';
};

/** Half-open token interval: `from` is included and `to` is excluded. */
export type TokenSpan = { from: number; to: number };
/** Character offsets point into the original text, retaining punctuation and accents. */
export type Token = { key: string; raw: string; start: number; end: number };
export type TeamReference = TokenSpan & { team: TeamPerspective };
export type PlayerMention = TokenSpan & { name?: string; shirtNumber?: number };
export type EventCue = TokenSpan & { event: SpokenEvent };
export type SubstitutionMarkers = {
  outgoing: TokenSpan[];
  incoming: TokenSpan[];
  connectors: TokenSpan[];
};
export type RelationMarkers = { before: TokenSpan[]; after: TokenSpan[]; barriers: TokenSpan[] };

export type AnalysisContext = {
  text: string;
  language: Language;
  rules: LanguageRules;
  players: RulePlayer[];
  tokens: Token[];
  words: string[];
  normalizedText: string;
  findPattern: (pattern: string) => TokenSpan[];
  originalText: (span: TokenSpan) => string;
  teamNames: TeamReference[];
  teamReferences: TeamReference[];
  knownNames: TokenSpan[];
  correction: TokenSpan | undefined;
};

export type DetectedEvent = {
  kind: 'event';
  event: SpokenEvent;
  candidates: EventCue[];
  eventCues: EventCue[];
  match: 'literal' | 'approximate';
  substitution: SubstitutionMarkers;
};
export type EventDecision = DetectedEvent | { kind: 'rejected'; reason: string };
export type InterpretationResult = {
  proposal: RuleProposal | null;
  warnings: string[];
  eventKeyword: string;
  eventMatch: 'none' | 'literal' | 'approximate';
};
