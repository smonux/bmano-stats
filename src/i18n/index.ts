import { useSyncExternalStore } from 'react';
import { catalog } from './messages';
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
  listeners.forEach((fn) => fn());
}
export function useLanguage() {
  return useSyncExternalStore((fn) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, getLanguage);
}
export function tr(
  source: string,
  values: Record<string, string | number> = {},
  locale: Language = language,
) {
  const index = ['en', 'de', 'fr', 'it', 'nl', 'pl'].indexOf(locale);
  const text = index < 0 ? source : (catalog[source]?.[index] ?? source);
  return text.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}
