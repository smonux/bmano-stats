import { tr } from '../i18n';
import { spokenTypes } from './event-types';
import { proposalSchema } from './schema';
import { definitions } from '../domain/event-definitions';
import { relatedTeam } from '../domain/events';
import type { EventDraft } from '../data/database';
import type { CaptureContext } from './capture-context';
import { resolveTeam, resolveDorsal } from './resolve-references';
import { lastGoalkeeper } from '../domain/goalkeepers';

// Public adapter API retained for callers and historical experiments.
export { captureContext, type CaptureContext } from './capture-context';
export { normalize, resolveTeam, resolveDorsal } from './resolve-references';

export function toVoiceDraft(
  rawText: string,
  proposal: unknown,
  context: CaptureContext,
): { draft: EventDraft; warnings: string[]; goalkeeperDefaultApplied?: boolean } {
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
  let goalkeeperDefaultApplied = false;
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
    draft.primaryDorsal = resolveDorsal(primaryReference, draft.teamId, context.data);
  }
  if (!draft.teamId) {
    warnings.push('Equipo sin resolver. No se ha supuesto equipo 1 ni equipo 2.');
  }
  if (draft.type && draft.type !== 'passive') {
    draft.primaryDorsal = resolveDorsal(primaryReference, draft.teamId, context.data);
    if (draft.type === 'save' && draft.primaryDorsal === '') {
      const keeper = lastGoalkeeper(context.match, context.data.players, draft.teamId);
      if (keeper) {
        draft.primaryDorsal = String(keeper.dorsal);
        goalkeeperDefaultApplied = true;
      }
    }
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
  return { draft, warnings, ...(goalkeeperDefaultApplied ? { goalkeeperDefaultApplied } : {}) };
}
