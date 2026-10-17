// Builds annotated text only: no models, audio synthesis or training.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { datasetContract } from './dataset/contract.mjs';
import { validateFamilies } from './dataset/validate-families.mjs';
import { hash, splitFamilies } from './dataset/partitions.mjs';
import { annotateRows } from './dataset/rows.mjs';
import { summarizeDataset } from './dataset/summary.mjs';
import { writeDatasetArtifacts } from './dataset/artifacts.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, 'datasets/voz-es');
const checkOnly = process.argv.includes('--check');
assert(
  process.argv.slice(2).every((value) => value === '--check'),
  'Solo se admite --check',
);
const { events, schema, tools, proposalSchema } = await datasetContract(root);
const seedBytes = await readFile(resolve(directory, 'seeds.json'));
const seeds = JSON.parse(seedBytes.toString('utf8'));
assert(Array.isArray(seeds), 'seeds.json debe ser una lista');
assert.equal(seeds.length, 215, 'Se esperan 215 familias semánticas');
validateFamilies(seeds, events, schema, proposalSchema);
const familySplits = splitFamilies(seeds, events);
const rows = annotateRows(seeds, tools, familySplits);
const { stats, dorsals } = summarizeDataset(rows, seeds, events, hash(seedBytes));
await writeDatasetArtifacts(directory, rows, tools, stats, checkOnly);
console.log(
  `${checkOnly ? 'Validado' : 'Generado'}: ${rows.length} muestras / ${seeds.length} familias; ${events.length} eventos; sin fuga de familias entre particiones.`,
);
console.log(
  JSON.stringify({
    splits: Object.fromEntries(
      Object.entries(stats.splits).map(([split, value]) => [split, value.samples]),
    ),
    abstentions: stats.abstentions,
    primaryNames: stats.primary_name_samples,
    namesWithDorsal: stats.primary_name_and_number_samples,
    shirtNumbers: dorsals,
  }),
);
