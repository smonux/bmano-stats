import type { Language } from '../../i18n';
import type { InterpretationResult } from '../analysis/types';

/** Spanish opt-in escape from the play grammar. Never inspect the note's contents. */
export function spokenNote(text: string, language: Language): InterpretationResult | null {
  if (language !== 'es') return null;
  const firstWord = /[\p{L}\p{N}]+/u.exec(text);
  if (!firstWord) return null;
  const key = firstWord[0].toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '');
  if (!key.startsWith('not') && !key.startsWith('coment')) return null;
  // Remove only the opening keyword and its separator; retain the rest as dictated.
  const body = text
    .slice(firstWord.index + firstWord[0].length)
    .replace(/^[\s:：,;.–—-]+/u, '')
    .trimEnd();
  return {
    proposal: { evento: 'nota', equipo: 'desconocido', nota: body },
    warnings: [],
    eventKeyword: firstWord[0],
    eventMatch: 'literal',
    defaultTeamApplied: false,
  };
}
