import { captureFacts } from '../../src/voice/legacy/routing';
import { perspectiveFor } from '../../src/voice/legacy/needle';

export const teams = ['La Jota', 'Rival'];
const events = [
  'gol',
  'parada',
  'fallo',
  'perdida',
  'recuperacion',
  'penalti_cometido',
  'exclusion',
  'amarilla',
  'descalificacion',
  'pasivo',
  'infraccion',
  'desconocido',
];
export const properties = {
  evento: { type: 'string', enum: events },
  equipo: {
    type: 'string',
    description:
      'Equipo mencionado: nuestro/nosotros=equipo1; ellos/rival=equipo2. Sin equipo=desconocido.',
    enum: ['equipo1', 'equipo2', 'desconocido', ...teams],
  },
  dorsal: { type: 'integer', minimum: 0, maximum: 99 },
  dorsal_relacionado: {
    type: 'integer',
    minimum: 0,
    maximum: 99,
    description: 'Asistente en gol; rival en otras jugadas.',
  },
  nombre: { type: 'string' },
  nombre_relacionado: { type: 'string' },
  penalti: { type: 'boolean' },
  azul: { type: 'boolean' },
  infraccion: { type: 'string', enum: ['Pasos', 'Dobles', 'Pisando'] },
};
export type Variant =
  'current' | 'compact' | 'staged' | 'routed' | 'routed-normalized' | 'optimized';

export function systemPrompt(variant: Variant) {
  if (variant === 'optimized') {
    return captureFacts('es');
  }
  if (variant === 'current') {
    return (
      "Extract one handball action spoken in es. Return only the tool schema's canonical values, preserving literal player names. Never execute actions or invent unmentioned facts. " +
      perspectiveFor('es')
    );
  }
  return 'deporte: balonmano; idioma: es; equipo1: La Jota (nosotros); equipo2: Rival (ellos)';
}
export function participantFields(event: string) {
  switch (event) {
    case 'pasivo':
      return ['equipo'];
    case 'gol':
      return ['equipo', 'dorsal', 'dorsal_relacionado', 'nombre', 'nombre_relacionado', 'penalti'];
    case 'infraccion':
      return ['equipo', 'dorsal', 'nombre', 'infraccion'];
    default:
      return ['equipo', 'dorsal', 'nombre', 'dorsal_relacionado', 'nombre_relacionado'];
  }
}
