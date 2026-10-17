import type { SpokenEvent } from '../event-types';
import { resolveSubstitutionRoles } from '../substitution';
import { contains, oppositeTeam, overlaps, uniqueTeam } from './spans';
import { MULTIPLE_ACTIONS } from './results';
import type { Participants } from './participants';
import type {
  AnalysisContext,
  DetectedEvent,
  PlayerMention,
  RuleProposal,
  TeamPerspective,
  TokenSpan,
} from './types';

const RELATED_EVENTS = new Set<SpokenEvent>([
  'gol',
  'parada',
  'recuperacion',
  'penalti_cometido',
  'exclusion',
  'descalificacion',
]);
const MAX_SUBJECT_DISTANCE = 2;
type ParticipantRegions = { primary: TokenSpan; related?: TokenSpan };

/** Fill proposal roles from literal mentions and explicit team perspective. */
export function assignParticipantRoles(
  context: AnalysisContext,
  detected: DetectedEvent,
  participants: Participants,
  proposal: RuleProposal,
  warnings: string[],
): string | undefined {
  if (detected.event === 'sustitucion') {
    return assignSubstitution(context, detected, participants, proposal, warnings);
  }
  const regions = findParticipantRegions(context, detected, participants);
  const primaryTeam = uniqueTeam(context.teamReferences, regions.primary);
  const relatedTeam = regions.related
    ? uniqueTeam(context.teamReferences, regions.related)
    : undefined;
  proposal.equipo = resolvePrimaryTeam(primaryTeam, relatedTeam, detected.event);
  if (detected.event === 'pasivo') {
    return;
  }
  copyPlayerFields(
    proposal,
    pickParticipant(participants.mentions, regions.primary, warnings),
    'primary',
  );
  if (!RELATED_EVENTS.has(detected.event) || !regions.related) {
    return;
  }
  const expectedTeam = expectedRelatedTeam(proposal.equipo, detected.event);
  if (expectedTeam && relatedTeam && expectedTeam !== relatedTeam) {
    warnings.push('El equipo del participante relacionado no coincide con su rol. Revísalo.');
    return;
  }
  copyPlayerFields(
    proposal,
    pickParticipant(participants.mentions, regions.related, warnings),
    'related',
  );
}

function assignSubstitution(
  context: AnalysisContext,
  detected: DetectedEvent,
  participants: Participants,
  proposal: RuleProposal,
  warnings: string[],
): string | undefined {
  const { outgoing, incoming, connectors } = detected.substitution;
  const roles = resolveSubstitutionRoles(
    participants.mentions,
    outgoing,
    incoming,
    connectors,
    context.tokens.length,
  );
  if (roles.kind === 'multiple') {
    return MULTIPLE_ACTIONS;
  }
  if (roles.kind === 'ambiguous') {
    warnings.push('No se ha resuelto quién sale y quién entra. Revisa los participantes.');
  } else {
    copyPlayerFields(proposal, roles.outgoing, 'primary');
    copyPlayerFields(proposal, roles.incoming, 'related');
  }
  proposal.equipo = uniqueTeam(context.teamReferences) ?? 'desconocido';
}

function findParticipantRegions(
  context: AnalysisContext,
  detected: DetectedEvent,
  participants: Participants,
): ParticipantRegions {
  const { tokens, findPattern, rules, teamReferences } = context;
  const {
    mentions,
    numbers,
    markers: { before, after },
  } = participants;
  const cue = detected.eventCues[0];
  let primary: TokenSpan = { from: 0, to: tokens.length };
  let related: TokenSpan | undefined;
  const beforeMarker = before.find(
    (marker) =>
      !after.some(
        (other) => overlaps(marker, other) && other.to - other.from >= marker.to - marker.from,
      ) &&
      mentions.some(
        (player) => player.to <= marker.from && marker.from - player.to <= MAX_SUBJECT_DISTANCE,
      ),
  );
  const afterMarker = after[0];
  if (beforeMarker) {
    const subject = mentions
      .filter(
        (player) =>
          player.to <= beforeMarker.from && beforeMarker.from - player.to <= MAX_SUBJECT_DISTANCE,
      )
      .at(-1);
    if (subject && cue.to <= subject.from) {
      related = { from: subject.from, to: beforeMarker.to };
      primary = { from: 0, to: subject.from };
    } else {
      related = { from: 0, to: beforeMarker.from };
      primary = { from: beforeMarker.to, to: tokens.length };
    }
  } else if (afterMarker) {
    if (afterMarker.from < cue.from) {
      related = { from: afterMarker.from, to: cue.from };
      primary = { from: cue.from, to: tokens.length };
    } else {
      related = { from: afterMarker.from, to: tokens.length };
      primary = { from: 0, to: afterMarker.from };
    }
  }
  // A loss may mention the recipient; that opponent is not a second stored participant.
  if (detected.event === 'perdida') {
    const destination = findPattern(rules.destination).find(
      (span) =>
        span.from > cue.from &&
        !numbers.some((number) => overlaps(number, span)) &&
        teamReferences.some((reference) => reference.from >= span.to),
    );
    if (destination) {
      primary = { from: 0, to: destination.from };
      related = { from: destination.to, to: tokens.length };
    }
  }
  return { primary, related };
}

function resolvePrimaryTeam(
  primary: TeamPerspective | undefined,
  related: TeamPerspective | undefined,
  event: SpokenEvent,
): RuleProposal['equipo'] {
  if (primary) {
    return primary;
  }
  if (!related) {
    return 'desconocido';
  }
  return event === 'gol' ? related : oppositeTeam(related);
}

function expectedRelatedTeam(
  primary: RuleProposal['equipo'],
  event: SpokenEvent,
): TeamPerspective | undefined {
  if (primary === 'desconocido') {
    return undefined;
  }
  return event === 'gol' ? primary : oppositeTeam(primary);
}

function pickParticipant(
  players: PlayerMention[],
  region: TokenSpan,
  warnings: string[],
): PlayerMention | undefined {
  const candidates = players.filter((player) => contains(region, player));
  if (candidates.length === 1) {
    return candidates[0];
  }
  const named = candidates.filter((player) => player.name);
  const numbered = candidates.filter((player) => player.shirtNumber !== undefined);
  if (named.length === 1 && numbered.length === 1) {
    return { ...named[0], shirtNumber: numbered[0].shirtNumber };
  }
  if (candidates.length > 1) {
    warnings.push('Hay varios jugadores posibles en un mismo rol; revisa los participantes.');
  }
  return undefined;
}

function copyPlayerFields(
  proposal: RuleProposal,
  player: PlayerMention | undefined,
  role: 'primary' | 'related',
): void {
  if (!player) {
    return;
  }
  if (role === 'primary') {
    if (player.name) {
      proposal.nombre = player.name;
    }
    if (player.shirtNumber !== undefined) {
      proposal.dorsal = player.shirtNumber;
    }
  } else {
    if (player.name) {
      proposal.nombre_relacionado = player.name;
    }
    if (player.shirtNumber !== undefined) {
      proposal.dorsal_relacionado = player.shirtNumber;
    }
  }
}
