import type { TokenSpan, TeamPerspective, TeamReference } from './types';

export const overlaps = (left: TokenSpan, right: TokenSpan): boolean =>
  left.from < right.to && right.from < left.to;

export const contains = (outer: TokenSpan, inner: TokenSpan): boolean =>
  inner.from >= outer.from && inner.to <= outer.to;

export function markTokens(occupied: Set<number>, span: TokenSpan): void {
  for (let index = span.from; index < span.to; index++) {
    occupied.add(index);
  }
}

export function uniqueTeam(
  references: TeamReference[],
  region?: TokenSpan,
): TeamPerspective | undefined {
  const applicable = region
    ? references.filter((reference) => contains(region, reference))
    : references;
  const teams = new Set(applicable.map((reference) => reference.team));
  if (teams.size === 1) {
    return teams.values().next().value;
  }
  return undefined;
}

export function oppositeTeam(team: TeamPerspective): TeamPerspective {
  return team === 'equipo1' ? 'equipo2' : 'equipo1';
}
