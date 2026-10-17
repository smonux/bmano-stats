import type { Language } from '../../i18n';
import type { LanguageRules } from './types';
import es from './es';
import en from './en';
import de from './de';
import fr from './fr';
import it from './it';
import nl from './nl';
import pl from './pl';

export const languageRules: Record<Language, LanguageRules> = { es, en, de, fr, it, nl, pl };
