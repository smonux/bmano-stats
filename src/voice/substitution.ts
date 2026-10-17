type Span = { from: number; to: number };
type Entity = Span & { nombre?: string; dorsal?: number };
type Marker = Span & { role: 'out' | 'in' };
type Roles = { out?: Entity; in?: Entity; ambiguous: boolean; multiple?: boolean };
/** Resolve direction explicitly; a bare pair of players has no assumed order. */
export function substitutionRoles(
  entities: Entity[],
  out: Span[],
  incoming: Span[],
  connectors: Span[],
  end: number,
): Roles {
  const markers: Marker[] = [
    ...out.map((span) => ({ ...span, role: 'out' as const })),
    ...incoming.map((span) => ({ ...span, role: 'in' as const })),
  ]
    .sort((a, b) => a.from - b.from || b.to - a.to)
    .filter(
      (span, index, all) =>
        !all.slice(0, index).some((prior) => prior.from <= span.from && prior.to >= span.to),
    );
  if (
    markers.filter((marker) => marker.role === 'out').length > 1 ||
    markers.filter((marker) => marker.role === 'in').length > 1
  )
    return { ambiguous: true, multiple: true };
  const result: Roles = { ambiguous: false };
  const used = new Set<Entity>();
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i],
      previous = markers[i - 1]?.to ?? 0,
      next = markers[i + 1]?.from ?? end;
    const before = entities
      .filter(
        (entity) =>
          !used.has(entity) &&
          entity.from >= previous &&
          entity.to <= marker.from &&
          marker.from - entity.to <= 1,
      )
      .at(-1);
    const connector = connectors.find((span) => span.from >= marker.to && span.from < next);
    const after = entities.filter(
      (entity) =>
        !used.has(entity) && entity.from >= marker.to && entity.to <= (connector?.from ?? next),
    );
    const chosen = before ?? (after.length === 1 ? after[0] : undefined);
    if (!before && after.length > 1) result.ambiguous = true;
    if (chosen) {
      result[marker.role] = chosen;
      used.add(chosen);
    }
  }
  // "Cambio de Ana por María": outgoing on the left, incoming on the right.
  // "Entra María por Ana": the explicit incoming role reverses that convention.
  const pairs = connectors.flatMap((connector) => {
    const left = entities.filter((entity) => entity.to <= connector.from),
      right = entities.filter((entity) => entity.from >= connector.to);
    return left.length === 1 && right.length === 1 ? [{ left: left[0], right: right[0] }] : [];
  });
  if (pairs.length === 1) {
    const { left, right } = pairs[0];
    if (result.in === left && !result.out) result.out = right;
    else if (result.out === left && !result.in) result.in = right;
    else if (!result.out && !result.in) {
      result.out = left;
      result.in = right;
    }
  }
  if (entities.some((entity) => entity !== result.out && entity !== result.in))
    result.ambiguous = true;
  return result;
}
