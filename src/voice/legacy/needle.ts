import type { Language } from '../../i18n';
import { extractionSchema, perspectiveRule } from '../schema';

export function perspectiveFor(language: Language) {
  const words: Record<Language, string> = {
    es: 'nuestro/nuestra/nosotros/mi equipo=equipo1; ellos/rival/contrario/suyo/su equipo=equipo2.',
    en: 'our/us/we/my team=equipo1; they/their/opponent=equipo2.',
    de: 'unser/wir/uns=equipo1; sie/ihr/Gegner=equipo2.',
    fr: 'notre/nos/nous=equipo1; eux/leur/adversaire=equipo2.',
    it: 'nostro/nostra/noi=equipo1; loro/avversario=equipo2.',
    nl: 'ons/onze/wij=equipo1; zij/hun/tegenstander=equipo2.',
    pl: 'nasz/nasza/my=equipo1; oni/ich/rywal=equipo2.',
  };
  return perspectiveRule + ' ' + words[language];
}
export function schemaForTeams(names: string[], language: Language = 'es') {
  return {
    ...extractionSchema,
    properties: {
      ...extractionSchema.properties,
      equipo: {
        ...extractionSchema.properties.equipo,
        enum: [...new Set([...extractionSchema.properties.equipo.enum, ...names])],
        description:
          perspectiveFor(language) +
          ' Team names in recorder perspective order: ' +
          JSON.stringify({ equipo1: names[0], equipo2: names[1] }),
      },
    },
  };
}
export function selectProposal(result: {
  success: boolean;
  function_calls: { name: string; arguments: unknown }[];
  suppressed_calls: { name: string; arguments: unknown }[];
  confidence: number | null;
  validation?: { ungrounded?: string[]; negation?: boolean };
}) {
  if (!result.success || result.validation?.ungrounded?.length || result.validation?.negation) {
    return {
      proposal: null,
      warnings: [
        'La interpretación no está respaldada por la frase. Completa el evento a partir de la transcripción.',
      ],
    };
  }
  const candidates = [...result.function_calls, ...result.suppressed_calls];
  if (candidates.length !== 1 || candidates[0].name !== 'registrar_jugada') {
    return {
      proposal: null,
      warnings: ['Needle no ha devuelto una única propuesta. No se han supuesto los datos.'],
    };
  }
  // A suppressed call is only a visibly uncertain draft, never an executed action.
  return {
    proposal: candidates[0].arguments,
    warnings: [
      'Propuesta de voz: revisa todos los campos antes de guardar.',
      ...(result.suppressed_calls.length
        ? ['Needle ha retenido esta propuesta por incertidumbre. Solo se guardará si la confirmas.']
        : result.confidence !== null && result.confidence < 0.5
          ? ['El modelo indica confianza baja.']
          : []),
    ],
  };
}
