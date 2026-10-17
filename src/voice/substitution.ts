import type { PlayerMention, TokenSpan } from './analysis/types';

type Direction = 'outgoing' | 'incoming';
type Marker = TokenSpan & { direction: Direction };
type AssignedPlayers = { outgoing?: PlayerMention; incoming?: PlayerMention };
type SubstitutionRoles =
  { kind: 'multiple' } | { kind: 'ambiguous' } | ({ kind: 'resolved' } & AssignedPlayers);

const MAX_SUBJECT_GAP = 1;

/** Resolve explicit directions; two unmarked players do not imply an order. */
export function resolveSubstitutionRoles(
  players: PlayerMention[],
  outgoing: TokenSpan[],
  incoming: TokenSpan[],
  connectors: TokenSpan[],
  tokenCount: number,
): SubstitutionRoles {
  const markers = distinctDirectionMarkers(outgoing, incoming);
  if (
    markers.filter((marker) => marker.direction === 'outgoing').length > 1 ||
    markers.filter((marker) => marker.direction === 'incoming').length > 1
  ) {
    return { kind: 'multiple' };
  }
  const assigned: AssignedPlayers = {};
  const usedPlayers = new Set<PlayerMention>();
  let ambiguous = false;
  for (const [index, marker] of markers.entries()) {
    const previousBoundary = markers[index - 1]?.to ?? 0;
    const nextBoundary = markers[index + 1]?.from ?? tokenCount;
    const preceding = players
      .filter(
        (player) =>
          !usedPlayers.has(player) &&
          player.from >= previousBoundary &&
          player.to <= marker.from &&
          marker.from - player.to <= MAX_SUBJECT_GAP,
      )
      .at(-1);
    const connector = connectors.find((span) => span.from >= marker.to && span.from < nextBoundary);
    const following = players.filter(
      (player) =>
        !usedPlayers.has(player) &&
        player.from >= marker.to &&
        player.to <= (connector?.from ?? nextBoundary),
    );
    let chosen = preceding;
    if (!chosen && following.length === 1) {
      chosen = following[0];
    }
    if (!preceding && following.length > 1) {
      ambiguous = true;
    }
    if (chosen) {
      assigned[marker.direction] = chosen;
      usedPlayers.add(chosen);
    }
  }
  completeConnectorPair(players, connectors, assigned);
  if (players.some((player) => player !== assigned.outgoing && player !== assigned.incoming)) {
    ambiguous = true;
  }
  if (ambiguous) {
    return { kind: 'ambiguous' };
  }
  return { kind: 'resolved', ...assigned };
}

function distinctDirectionMarkers(outgoing: TokenSpan[], incoming: TokenSpan[]): Marker[] {
  return [
    ...outgoing.map((span) => ({ ...span, direction: 'outgoing' as const })),
    ...incoming.map((span) => ({ ...span, direction: 'incoming' as const })),
  ]
    .sort((left, right) => left.from - right.from || right.to - left.to)
    .filter(
      (span, index, all) =>
        !all.slice(0, index).some((prior) => prior.from <= span.from && prior.to >= span.to),
    );
}

function completeConnectorPair(
  players: PlayerMention[],
  connectors: TokenSpan[],
  assigned: AssignedPlayers,
): void {
  const pairs = connectors.flatMap((connector) => {
    const left = players.filter((player) => player.to <= connector.from);
    const right = players.filter((player) => player.from >= connector.to);
    if (left.length === 1 && right.length === 1) {
      return [{ left: left[0], right: right[0] }];
    }
    return [];
  });
  if (pairs.length !== 1) {
    return;
  }
  const { left, right } = pairs[0];
  // "Entra María por Ana": an explicit incoming marker reverses the default connector order.
  if (assigned.incoming === left && !assigned.outgoing) {
    assigned.outgoing = right;
  } else if (assigned.outgoing === left && !assigned.incoming) {
    assigned.incoming = right;
  } else if (!assigned.outgoing && !assigned.incoming) {
    assigned.outgoing = left;
    assigned.incoming = right;
  }
}
