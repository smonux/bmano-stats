import type { Language } from '../../i18n';
import { languageRules } from '../languages';
import { numberAt, numberKey } from '../numbers';

/** Historical benchmark helper; active extraction uses numberAt on token spans. */
export function normalizeShirtNumbers(text: string, language: Language) {
  return text.replace(
    new RegExp(
      `(\\b(?:${languageRules[language].numbers.shirtMarker})\\s+)([\\p{L}-]+(?:\\s+[\\p{L}-]+){0,5})`,
      'giu',
    ),
    (whole, prefix: string, phrase: string) => {
      const raw = phrase.split(/\s+/);
      const match = numberAt(raw.map(numberKey), 0, language);
      return match?.value !== undefined
        ? prefix +
            match.value +
            (match.end < raw.length ? ' ' + raw.slice(match.end).join(' ') : '')
        : whole;
    },
  );
}
