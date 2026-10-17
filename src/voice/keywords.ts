import type { Language } from '../i18n';
import { voiceKeywords } from '../i18n/voice';
import { numberKey, spokenNumber } from './numbers';
/** Match-specific Whistle hints: domain vocabulary plus only known names/numbers. */
export function whistleKeywords(
  language: Language,
  teams: string[],
  players: readonly { name: string; dorsal: number | null }[],
) {
  const numbers = [
    ...new Set(
      players.flatMap((player) =>
        player.dorsal !== null &&
        Number.isInteger(player.dorsal) &&
        player.dorsal >= 0 &&
        player.dorsal <= 99
          ? [player.dorsal]
          : [],
      ),
    ),
  ].sort((a, b) => a - b);
  const values = [
    ...voiceKeywords[language],
    ...teams,
    ...players.map((player) => player.name),
    ...numbers.flatMap((number) => [String(number), spokenNumber(number, language)]),
  ];
  const seen = new Set<string>();
  return values
    .map((value) => value.replace(/[\r\n]/g, ' ').trim())
    .filter((value) => {
      const key = numberKey(value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}
