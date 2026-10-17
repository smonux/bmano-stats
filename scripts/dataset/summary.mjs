import assert from 'node:assert/strict';
import { splitSeed } from './partitions.mjs';

export function summarizeDataset(rows, seeds, events, seedHash) {
  const count = (items, key) =>
    Object.fromEntries(
      [...new Set(items.map(key))]
        .sort()
        .map((value) => [value, items.filter((item) => key(item) === value).length]),
    );
  const calls = rows.flatMap((row) => row.answers.map((call) => call.arguments));
  const nameValues = calls.flatMap((args) =>
    [args.nombre, args.nombre_relacionado].filter(Boolean),
  );
  const dorsals = [
    ...new Set(
      calls.flatMap((args) =>
        [args.dorsal, args.dorsal_relacionado].filter((value) => value !== undefined),
      ),
    ),
  ].sort((a, b) => a - b);
  assert(
    dorsals.includes(0) && dorsals.includes(6) && dorsals.includes(99),
    'Se requieren dorsales 0, 6 y 99',
  );
  assert(
    calls.some((args) => args.nombre && args.dorsal === undefined),
    'Faltan nombres sin dorsal',
  );
  assert(
    calls.some((args) => args.nombre && args.dorsal !== undefined),
    'Faltan nombres acompañados de dorsal',
  );
  assert(
    calls.some((args) => args.dorsal_relacionado !== undefined) &&
      calls.some((args) => args.nombre_relacionado),
    'Faltan participantes relacionados',
  );
  for (const event of events) {
    for (const team of ['equipo1', 'equipo2', 'desconocido']) {
      assert(
        calls.some((args) => args.evento === event && args.equipo === team),
        `${event}: falta ${team}`,
      );
    }
  }
  for (const kind of ['Pasos', 'Dobles', 'Pisando']) {
    assert(
      calls.some((args) => args.infraccion === kind),
      `Falta infracción ${kind}`,
    );
  }
  for (const event of ['gol', 'parada', 'fallo']) {
    assert(
      calls.some((args) => args.evento === event && args.penalti),
      `Falta ${event} de siete metros`,
    );
  }
  assert(
    calls.some((args) => args.azul),
    'Falta tarjeta azul',
  );
  assert(
    calls.some(
      (args) =>
        args.evento === 'exclusion' && args.dorsal === undefined && args.nombre === undefined,
    ),
    'Falta exclusión sin jugador',
  );
  for (const split of ['train', 'validation', 'test']) {
    assert(
      rows.some((row) => row.metadata.split === split && row.answers.length === 0),
      `${split}: falta abstención`,
    );
    assert(
      rows.some(
        (row) => row.metadata.split === split && row.answers[0]?.arguments.evento === 'desconocido',
      ),
      `${split}: falta acción incierta`,
    );
  }

  const stats = {
    version: 2,
    language: 'es',
    source: 'synthetic_text',
    authors: ['gpt-6-luna', 'Codex'],
    review: 'Codex; schema_and_manual',
    samples: rows.length,
    families: seeds.length,
    split_seed: splitSeed,
    splits: Object.fromEntries(
      ['train', 'validation', 'test'].map((split) => [
        split,
        {
          samples: rows.filter((row) => row.metadata.split === split).length,
          families: new Set(
            rows.filter((row) => row.metadata.split === split).map((row) => row.metadata.family_id),
          ).size,
          categories: count(
            rows.filter((row) => row.metadata.split === split),
            (row) => row.metadata.category,
          ),
        },
      ]),
    ),
    categories: count(rows, (row) => row.metadata.category),
    teams: count(calls, (args) => args.equipo),
    abstentions: rows.filter((row) => !row.answers.length).length,
    styles: count(rows, (row) => row.metadata.style),
    primary_name_samples: calls.filter((args) => args.nombre).length,
    primary_number_samples: calls.filter((args) => args.dorsal !== undefined).length,
    primary_name_and_number_samples: calls.filter(
      (args) => args.nombre && args.dorsal !== undefined,
    ).length,
    related_name_samples: calls.filter((args) => args.nombre_relacionado).length,
    unique_literal_names: [...new Set(nameValues)].sort(),
    shirt_numbers: dorsals,
    seed_sha256: seedHash,
  };
  return { stats, dorsals };
}
