import type { Language } from '../../i18n';

/** Same two fictional identities (#7 and #9), named in the recognition language. */
export const practiceNames: Record<Language, { scorer: string; assistant: string }> = {
  es: { scorer: 'Marta', assistant: 'Elena' },
  en: { scorer: 'Martha', assistant: 'Helen' },
  de: { scorer: 'Martha', assistant: 'Helene' },
  fr: { scorer: 'Marthe', assistant: 'Hélène' },
  it: { scorer: 'Marta', assistant: 'Elena' },
  nl: { scorer: 'Martha', assistant: 'Heleen' },
  pl: { scorer: 'Marta', assistant: 'Helena' },
};
