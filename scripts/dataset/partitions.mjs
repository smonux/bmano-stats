import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const hash = (value) => createHash('sha256').update(value).digest('hex');
export const splitSeed = 'bmano-voz-es-v1';

export function splitFamilies(seeds, events) {
  // Keep both abstentions and uncertain sports actions in every partition.
  const strata = [...events, 'inciertos', 'rechazos'];
  const familySplits = new Map();
  for (const category of strata) {
    const families = seeds
      .filter((family) =>
        events.includes(category)
          ? family.category === category
          : !events.includes(family.category) &&
            family.variants.some((variant) => variant.arguments?.evento === 'desconocido') ===
              (category === 'inciertos'),
      )
      .sort((left, right) =>
        hash(`${splitSeed}:${left.id}`).localeCompare(hash(`${splitSeed}:${right.id}`), 'en'),
      );
    assert.equal(
      families.length,
      category === 'inciertos' ? 3 : category === 'rechazos' ? 32 : 15,
      `Cobertura de ${category}`,
    );
    const testCount = category === 'inciertos' ? 1 : category === 'rechazos' ? 4 : 2;
    const validationCount = testCount;
    families.forEach((family, index) =>
      familySplits.set(
        family.id,
        index < testCount ? 'test' : index < testCount + validationCount ? 'validation' : 'train',
      ),
    );
  }

  return familySplits;
}
