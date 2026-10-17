import { getLanguage, supportedLanguage, type Language } from './index';
export function savedVoiceLanguage(): Language {
  try {
    return supportedLanguage(localStorage.getItem('handball-voice-language') ?? getLanguage());
  } catch {
    return getLanguage();
  }
}
import { languageRules } from '../voice/languages';

export const voiceKeywords: Record<Language, string[]> = Object.fromEntries(
  Object.entries(languageRules).map(([language, rules]) => [language, [...rules.whistleKeywords]]),
) as Record<Language, string[]>;
