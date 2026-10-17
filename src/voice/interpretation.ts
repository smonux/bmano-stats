import { tr } from '../i18n';
import { spokenTypes } from './event-types';
import { proposalSchema } from './schema';
import { definitions, elapsed, relatedTeam, type Match, type Snapshot } from '../domain/model';
import type { EventDraft } from '../data/database';

const firstTeamWords = [
  'our',
  'ours',
  'us',
  'we',
  'our team',
  'my team',
  'team1',
  'team 1',
  'unser',
  'unsere',
  'unseren',
  'unser team',
  'wir',
  'uns',
  'notre',
  'nos',
  'nous',
  'notre equipe',
  'nostro',
  'nostra',
  'nostri',
  'nostre',
  'noi',
  'nostra squadra',
  'ons',
  'onze',
  'wij',
  'we',
  'ons team',
  'nasz',
  'nasza',
  'nasze',
  'nasi',
  'my',
  'nas',
  'nasza druzyna',
  'equipo1',
  'equipo 1',
  'equipo uno',
  'primer equipo',
  'nuestro',
  'nuestra',
  'nuestros',
  'nuestras',
  'nosotros',
  'nosotras',
  'mi equipo',
  'nuestro equipo',
];
const secondTeamWords = [
  'they',
  'them',
  'their',
  'theirs',
  'opponent',
  'opponents',
  'their team',
  'team2',
  'team 2',
  'sie',
  'ihre',
  'ihr',
  'gegner',
  'gegnerisch',
  'eux',
  'elles',
  'leur',
  'leurs',
  'adversaire',
  'adversaires',
  'loro',
  'avversario',
  'avversari',
  'avversaria',
  'zij',
  'ze',
  'hun',
  'tegenstander',
  'tegenstanders',
  'oni',
  'one',
  'ich',
  'rywal',
  'rywalka',
  'przeciwnik',
  'przeciwnicy',
  'equipo2',
  'equipo 2',
  'equipo dos',
  'segundo equipo',
  'ellos',
  'ellas',
  'rival',
  'rivales',
  'contrario',
  'contraria',
  'contrarios',
  'contrarias',
  'suyo',
  'suya',
  'suyos',
  'suyas',
  'su equipo',
  'el rival',
  'equipo rival',
  'el contrario',
];

export type CaptureContext = { match: Match; data: Snapshot; period: number; minute: number };
export function captureContext(match: Match, data: Snapshot): CaptureContext {
  return {
    match,
    data,
    period: match.clock.period,
    minute: Math.min(999, Math.floor(elapsed(match.clock) / 60000)),
  };
}
export const normalize = (value: string) =>
  value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^\p{L}0-9]+/gu, ' ')
    .trim();
export function resolveTeam(reference: string, context: CaptureContext): string | null {
  const key = normalize(reference);
  const { match, data } = context;
  if (!key) {
    return null;
  }
  if (firstTeamWords.includes(key)) {
    return match.localTeamId;
  }
  if (secondTeamWords.includes(key)) {
    return match.visitorTeamId;
  }
  const ids = [match.localTeamId, match.visitorTeamId];
  const matches = data.teams.filter((t) => ids.includes(t.id) && normalize(t.name) === key);
  if (matches.length === 1) {
    return matches[0].id;
  }
  return null;
}
export function resolveDorsal(reference: string, teamId: string | null, data: Snapshot): string {
  if (!teamId) {
    return '';
  }
  const key = normalize(reference);
  const number = key.match(/^(?:(?:dorsal|numero) )?(\d{1,2})$/);
  if (number) {
    return String(Number(number[1]));
  }
  if (!key) {
    return '';
  }
  const candidates = data.players.filter(
    (player) =>
      player.teamId === teamId &&
      !player.deletedAt &&
      !player.isUnknown &&
      player.name &&
      normalize(player.name) === key,
  );
  return candidates.length === 1 ? String(candidates[0].dorsal) : '';
}
export function toVoiceDraft(
  rawText: string,
  proposal: unknown,
  context: CaptureContext,
): { draft: EventDraft; warnings: string[] } {
  const draft: EventDraft = {
    matchId: context.match.id,
    type: null,
    teamId: null,
    primaryDorsal: '',
    relatedDorsal: '',
    period: context.period,
    minute: context.minute,
    metadata: {},
    note: '',
    rawText,
  };
  const warnings: string[] = [];
  const parsed = proposalSchema.safeParse(proposal);
  if (!parsed.success) {
    return {
      draft,
      warnings: [
        'No se pudo interpretar una única jugada. Conserva la transcripción y completa el evento.',
      ],
    };
  }
  const parsedProposal = parsed.data;
  const primaryReference =
    parsedProposal.dorsal !== undefined ? String(parsedProposal.dorsal) : parsedProposal.nombre;
  const relatedReference =
    parsedProposal.dorsal_relacionado !== undefined
      ? String(parsedProposal.dorsal_relacionado)
      : parsedProposal.nombre_relacionado;
  draft.type = spokenTypes[parsedProposal.evento as keyof typeof spokenTypes] ?? null;
  draft.teamId = resolveTeam(parsedProposal.equipo, context);
  if (!draft.type) {
    warnings.push('Tipo de evento sin resolver.');
  }
  if (!draft.teamId) {
    warnings.push('Equipo sin resolver. No se ha supuesto equipo 1 ni equipo 2.');
  }
  if (draft.type && draft.type !== 'passive') {
    draft.primaryDorsal = resolveDorsal(primaryReference, draft.teamId, context.data);
    if (primaryReference && !draft.primaryDorsal) {
      warnings.push(
        tr('«{player}» no identifica un jugador único: se atribuirá a Desconocido.', {
          player: primaryReference,
        }),
      );
    }
    if (definitions[draft.type].related && draft.teamId) {
      draft.relatedDorsal = resolveDorsal(
        relatedReference,
        relatedTeam(context.match, draft.type, draft.teamId),
        context.data,
      );
      if (relatedReference && !draft.relatedDorsal) {
        warnings.push(
          tr('Participante relacionado «{player}» sin resolver.', { player: relatedReference }),
        );
      }
    }
    if (definitions[draft.type].penalty && parsedProposal.penalti) {
      draft.metadata.penalty = true;
    }
    if (draft.type === 'disqualification' && parsedProposal.azul) {
      draft.metadata.blue = true;
    }
    if (draft.type === 'infraction' && parsedProposal.infraccion) {
      draft.metadata.infraction = parsedProposal.infraccion;
    }
  }
  return { draft, warnings };
}
