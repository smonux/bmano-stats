import type { JsonSchema } from 'cactus-needle/browser';
import { definitions } from '../domain/event-definitions';
import type { Language } from '../i18n';
import { spokenTypes, type SpokenEvent } from './event-types';
import type { TeamPerspective } from './analysis/types';

const roles: Record<SpokenEvent, [string, string?]> = {
  gol: ['Goleador', 'Asistente'],
  parada: ['Portero', 'Lanzador rival'],
  fallo: ['Lanzador'],
  perdida: ['Responsable'],
  recuperacion: ['Recuperador', 'Rival que pierde'],
  penalti_cometido: ['Infractor', 'Beneficiario rival'],
  exclusion: ['Excluido', 'Provocador rival'],
  amarilla: ['Amonestado'],
  descalificacion: ['Descalificado', 'Provocador rival'],
  pasivo: ['Equipo'],
  infraccion: ['Infractor'],
  sustitucion: ['Sale', 'Entra'],
};

/** One fixed schema per event: ASR keyword omissions must not hide optional fields. */
export function toolForEvent(event: SpokenEvent, teams: string[], defaultTeam: TeamPerspective) {
  const definition = definitions[spokenTypes[event]];
  const [primary, related] = roles[event];
  const properties: Record<string, JsonSchema> = {
    equipo: {
      type: 'string',
      enum: ['equipo1', 'equipo2', 'desconocido'],
      default: defaultTeam,
      description: `Equipo de ${primary}: equipo1=${teams[0] ?? ''}; equipo2=${teams[1] ?? ''}.`,
    },
  };
  const number = (role: string): JsonSchema => ({
    type: 'integer',
    minimum: 0,
    maximum: 99,
    description: `Dorsal: ${role}.`,
  });
  const name = (role: string): JsonSchema => ({ type: 'string', description: `Nombre: ${role}.` });
  if (event !== 'pasivo') {
    properties.dorsal = number(primary);
    properties.nombre = name(primary);
    if (related) {
      // Goal-specific names keep the model's task explicit; the adapter maps them to storage.
      properties[event === 'gol' ? 'dorsal_asistente' : 'dorsal_relacionado'] = number(related);
      properties[event === 'gol' ? 'nombre_asistente' : 'nombre_relacionado'] = name(related);
    }
    if (definition.penalty) {
      properties.penalti = { type: 'boolean', description: 'Lanzamiento de siete metros.' };
    }
    if (event === 'descalificacion') {
      properties.azul = { type: 'boolean', description: 'Tarjeta azul.' };
    }
    if (event === 'infraccion') {
      properties.infraccion = { type: 'string', enum: ['Pasos', 'Dobles', 'Pisando'] };
    }
  }
  return {
    [event]: {
      description: definition.label,
      inputSchema: {
        type: 'object' as const,
        properties,
        required: ['equipo'],
        additionalProperties: false,
      },
    },
  };
}

const perspective: Record<Language, string> = {
  es: 'equipo1=nuestro/nosotros; equipo2=rival/ellos; nos han marcado=equipo2',
  en: 'equipo1=our/we; equipo2=their/opponent; they scored against us=equipo2',
  de: 'equipo1=unser/wir; equipo2=Gegner/sie; Tor gegen uns=equipo2',
  fr: 'equipo1=notre/nous; equipo2=adversaire/eux; but encaissé=equipo2',
  it: 'equipo1=nostro/noi; equipo2=avversario/loro; gol subito=equipo2',
  nl: 'equipo1=ons/wij; equipo2=tegenstander/zij; tegendoelpunt=equipo2',
  pl: 'equipo1=nasz/my; equipo2=rywal/oni; stracony gol=equipo2',
};

export function extractionFacts(language: Language, defaultTeam: TeamPerspective) {
  return `locale:${language}; handball; ${perspective[language]}; never home/away; team=main actor, not recipient; default=${defaultTeam}; shirts 0-99; 7m is not shirt; omit absent facts; no call if negated/cancelled.`;
}
