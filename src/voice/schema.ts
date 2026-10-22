import { z } from 'zod';
import { spokenTypes } from './event-types';

// Perspective is independent of the venue. Existing v1 storage keys retain their names.
export const perspectiveRule =
  'Recorder perspective: own team=equipo1, opponents=equipo2, NEVER home/away. If team is not mentioned use desconocido.';
export const proposalSchema = z.object({
  evento: z.enum(['desconocido', 'nota', ...Object.keys(spokenTypes)]),
  nota: z.string().max(10000).default(''),
  equipo: z.string().max(100).default(''),
  dorsal: z.number().int().min(0).max(99).optional(),
  nombre: z.string().max(100).default(''),
  dorsal_relacionado: z.number().int().min(0).max(99).optional(),
  nombre_relacionado: z.string().max(100).default(''),
  penalti: z.boolean().default(false),
  azul: z.boolean().default(false),
  infraccion: z.enum(['Pasos', 'Dobles', 'Pisando', '']).default(''),
});
export const extractionSchema = {
  type: 'object',
  properties: {
    evento: {
      type: 'string',
      enum: [...Object.keys(spokenTypes), 'desconocido'],
      description:
        'Canonical event: gol=goal, parada=goalkeeper save, fallo=missed shot, perdida=turnover, recuperacion=ball recovery, penalti_cometido=conceded penalty, exclusion=two-minute suspension, amarilla=yellow card, descalificacion=disqualification, pasivo=passive play, infraccion=rule violation, sustitucion=player substitution (outgoing primary, incoming related, same team). desconocido=unknown or not exactly one play.',
    },
    equipo: {
      type: 'string',
      enum: ['equipo1', 'equipo2', 'nuestro', 'rival', 'desconocido'],
      description: 'Primary player team. ' + perspectiveRule,
    },
    dorsal: {
      type: 'integer',
      minimum: 0,
      maximum: 99,
      description: 'Primary player shirt number, only if mentioned.',
    },
    nombre: { type: 'string', description: 'Literal primary player name, only if mentioned.' },
    dorsal_relacionado: {
      type: 'integer',
      minimum: 0,
      maximum: 99,
      description:
        'Shirt number of assist provider for a goal, opponent shooter for a save, related opponent, or incoming player for a substitution (same team).',
    },
    nombre_relacionado: { type: 'string', description: 'Literal related player name.' },
    penalti: {
      type: 'boolean',
      description: 'True if the goal, save or miss is a seven-metre penalty.',
    },
    azul: { type: 'boolean', description: 'True if a blue card is mentioned.' },
    infraccion: {
      type: 'string',
      enum: ['Pasos', 'Dobles', 'Pisando'],
      description: 'Violation: Pasos=steps, Dobles=double dribble, Pisando=goal area violation.',
    },
  },
  required: ['evento', 'equipo'],
  additionalProperties: false,
} as const;
