import assert from 'node:assert/strict';

export function annotateRows(seeds, tools, familySplits) {
  const rows = seeds.flatMap((family) =>
    family.variants.map((variant, index) => ({
      id: `${family.id}-${index + 1}`,
      query: variant.text,
      system: `locale:es; sport:handball; perspective:recorder; equipo1=${family.teams[0]}; equipo2=${family.teams[1]}; nuestro/nosotros/mi equipo=equipo1; ellos/rival/contrario/suyo=equipo2; local/visitante=sin perspectiva; equipo no mencionado=desconocido`,
      tools,
      answers:
        variant.arguments === null
          ? []
          : [{ name: 'registrar_jugada', arguments: variant.arguments }],
      metadata: {
        family_id: family.id,
        category: family.category,
        split: familySplits.get(family.id),
        style: variant.style,
        teams: family.teams,
        annotation_note: family.reason,
        source: 'synthetic_text',
        author: family.author ?? 'gpt-6-luna',
        review: 'Codex; schema_and_manual',
        revision: family.revision ?? 1,
      },
    })),
  );
  assert.equal(rows.length, 645);
  return rows;
}
