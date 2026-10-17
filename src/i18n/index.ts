import { useSyncExternalStore } from 'react';
import { catalog, translationLanguages } from './messages';
export const languages = {
  es: 'Español',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
} as const;
export type Language = keyof typeof languages;
export const supportedLanguage = (value: string): Language =>
  Object.hasOwn(languages, value) ? (value as Language) : 'es';
let language: Language = 'es';
try {
  language = supportedLanguage(
    localStorage.getItem('handball-language') ?? navigator.language.split('-')[0],
  );
} catch {
  /* Storage may be unavailable. */
}
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export function setLanguage(value: Language) {
  language = value;
  try {
    localStorage.setItem('handball-language', value);
  } catch {}
  document.documentElement.lang = value;
  listeners.forEach((listener) => listener());
}
export function useLanguage() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, getLanguage);
}
export function tr(
  source: string,
  values: Record<string, string | number> = {},
  locale: Language = language,
) {
  const index = (translationLanguages as readonly string[]).indexOf(locale);
  const text = index < 0 ? source : (catalog[source]?.[index] ?? source);
  return text.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}
