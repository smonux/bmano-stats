import { z } from 'zod';
import type { CompletionResult } from 'cactus-needle/browser';
import type { SpokenEvent } from './event-types';
import type { RuleProposal, TeamPerspective } from './analysis/types';

const fieldSchemas = {
  equipo: z.enum(['equipo1', 'equipo2']),
  dorsal: z.number().int().min(0).max(99),
  nombre: z.string().trim().min(1).max(100),
  dorsal_relacionado: z.number().int().min(0).max(99),
  nombre_relacionado: z.string().trim().min(1).max(100),
  penalti: z.boolean(),
  azul: z.boolean(),
  infraccion: z.enum(['Pasos', 'Dobles', 'Pisando']),
};
const relatedEvents = new Set<SpokenEvent>([
  'gol',
  'parada',
  'recuperacion',
  'penalti_cometido',
  'exclusion',
  'descalificacion',
  'sustitucion',
]);
const penaltyEvents = new Set<SpokenEvent>(['gol', 'parada', 'fallo']);

/** Validate a proposal for review; no linguistic extraction or perspective overrides happen here. */
export function adaptNeedleResult(
  event: SpokenEvent,
  result: CompletionResult,
  defaultTeam: TeamPerspective,
) {
  const warnings = ['Propuesta de voz: revisa todos los campos antes de guardar.'];
  const proposal: RuleProposal = { evento: event, equipo: defaultTeam };
  const calls = [...result.function_calls, ...result.suppressed_calls];
  const usable =
    result.success &&
    calls.length === 1 &&
    calls[0].name === event &&
    !result.validation?.negation &&
    !result.validation?.ungrounded?.length;
  if (!usable) {
    warnings.push(
      'Needle no ha devuelto una propuesta válida. Completa los datos desde la transcripción.',
    );
    return {
      proposal,
      warnings: [...warnings, 'Se ha aplicado el equipo por defecto. Revisa el equipo.'],
    };
  }
  const arguments_ = { ...calls[0].arguments };
  if (event === 'gol') {
    if ('dorsal_asistente' in arguments_)
      arguments_.dorsal_relacionado = arguments_.dorsal_asistente;
    if ('nombre_asistente' in arguments_)
      arguments_.nombre_relacionado = arguments_.nombre_asistente;
    delete arguments_.dorsal_asistente;
    delete arguments_.nombre_asistente;
  }
  for (const [field, value] of Object.entries(arguments_)) {
    if (value === undefined) continue;
    const schema = fieldSchemas[field as keyof typeof fieldSchemas];
    const allowed = schema && fieldAllowed(event, field);
    const parsed = allowed ? schema.safeParse(value) : null;
    if (parsed?.success) {
      Object.assign(proposal, { [field]: parsed.data });
    } else if (field !== 'equipo' || value !== 'desconocido') {
      warnings.push('Needle ha devuelto campos no válidos; se han omitido. Revisa los datos.');
    }
  }
  if (!fieldSchemas.equipo.safeParse(arguments_.equipo).success) {
    warnings.push('Se ha aplicado el equipo por defecto. Revisa el equipo.');
  }
  if (result.suppressed_calls.length || (result.confidence !== null && result.confidence < 0.5)) {
    warnings.push('Needle indica incertidumbre. Revisa la propuesta antes de guardar.');
  }
  return { proposal, warnings: [...new Set(warnings)] };
}

function fieldAllowed(event: SpokenEvent, field: string) {
  if (field === 'equipo') return true;
  if (event === 'pasivo') return false;
  if (field === 'dorsal' || field === 'nombre') return true;
  if (field === 'dorsal_relacionado' || field === 'nombre_relacionado')
    return relatedEvents.has(event);
  if (field === 'penalti') return penaltyEvents.has(event);
  if (field === 'azul') return event === 'descalificacion';
  return field === 'infraccion' && event === 'infraccion';
}
