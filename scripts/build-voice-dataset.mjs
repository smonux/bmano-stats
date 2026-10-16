// Builds annotated text data only. Does not load models, synthesize audio or train.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { rolldown } from 'rolldown';
import { strToU8, zipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, 'datasets/voz-es');
const checkOnly = process.argv.includes('--check');
assert(process.argv.slice(2).every(value => value === '--check'), 'Solo se admite --check');

// Read the application's real schema without maintaining a second field list.
const bundle = await rolldown({ input: resolve(root, 'src/voice/interpretation.ts'), platform: 'node', logLevel: 'silent' });
const { output } = await bundle.generate({ format: 'esm' });
await bundle.close();
assert.equal(output.length, 1, 'El esquema debe caber en un módulo');
const { extractionSchema, proposalSchema } = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);
const events = extractionSchema.properties.evento.enum.filter(value => value !== 'desconocido');
const schema = structuredClone(extractionSchema);
schema.properties.equipo.enum = ['equipo1', 'equipo2', 'desconocido'];
schema.properties.equipo.description = 'Equipo del participante principal desde quien graba: nuestro/nosotros/mi equipo=equipo1; ellos/rival/contrario/suyo=equipo2. Sin referencia al equipo: desconocido. Local y visitante no determinan la perspectiva.';
const tools = [{
  name: 'registrar_jugada',
  description: 'Extrae una sola jugada de balonmano afirmada. Conserva solo los datos explícitos. Una frase ajena al juego, negada o con varias jugadas no genera llamadas.',
  parameters: schema,
}];
const seeds = JSON.parse(await readFile(resolve(directory, 'seeds.json'), 'utf8'));
assert(Array.isArray(seeds), 'seeds.json debe ser una lista');
assert.equal(seeds.length, 200, 'Se esperan 200 familias semánticas');

const ids = new Set(), texts = new Set(), normalizedFamilies = new Map();
const errors = [];
const requireThat = (condition, message) => { if (!condition) errors.push(message); };
const normalize = text => text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const numberWords = number => number < 10 ? units[number] : number < 20 ? teens[number - 10] : number % 10 === 0 ? tens[number / 10] : number < 30 ? `veinti${units[number % 10]}` : `${tens[Math.floor(number / 10)]} y ${units[number % 10]}`;
// Annotation lint only: checks literal number evidence, never interprets app input.
const numberIsMentioned = (text, number) => {
  const haystack = ` ${normalize(text)} `;
  const words = numberWords(number);
  const spellings = [String(number), words, ...(number === 1 ? ['un', 'una'] : number === 21 ? ['veintiun', 'veintiuna'] : [])];
  return spellings.some(value => haystack.includes(` ${normalize(value)} `));
};
const relatedEvents = new Set(['gol', 'parada', 'recuperacion', 'penalti_cometido', 'exclusion', 'descalificacion']);
for (const family of seeds) {
  const where = family.id ?? '(sin id)';
  requireThat(typeof family.id === 'string' && /^[a-z][a-z0-9_-]+$/.test(family.id), `${where}: identificador inválido`);
  requireThat(!ids.has(family.id), `${where}: familia duplicada`); ids.add(family.id);
  requireThat(typeof family.category === 'string' && family.category.length > 0, `${where}: falta categoría`);
  requireThat(Array.isArray(family.teams) && family.teams.length === 2 && family.teams.every(name => typeof name === 'string' && name.trim().length > 0 && name.length <= 100) && normalize(family.teams[0]) !== normalize(family.teams[1]), `${where}: se requieren dos equipos distintos`);
  requireThat(typeof family.reason === 'string' && family.reason.length > 0, `${where}: falta criterio de anotación`);
  requireThat(Array.isArray(family.variants) && family.variants.length === 3, `${where}: se esperan tres variantes`);
  for (const [index, variant] of (family.variants ?? []).entries()) {
    const label = `${where}/${index + 1}`;
    requireThat(typeof variant.text === 'string' && variant.text.trim().length > 0 && variant.text.length <= 1000, `${label}: texto inválido`);
    requireThat(typeof variant.style === 'string' && variant.style.length > 0, `${label}: falta estilo`);
    if (typeof variant.text !== 'string') continue;
    if (index === 2) {
      requireThat(variant.style === 'parafrasis', `${label}: la tercera variante debe ser una paráfrasis`);
      requireThat(normalize(variant.text) !== normalize(family.variants[0].text), `${label}: la paráfrasis solo cambia puntuación o tildes`);
    }
    requireThat(!texts.has(variant.text), `${label}: texto literal duplicado`); texts.add(variant.text);
    const key = normalize(variant.text);
    requireThat(!normalizedFamilies.has(key) || normalizedFamilies.get(key) === family.id, `${label}: texto equivalente en otra familia (${normalizedFamilies.get(key)})`);
    normalizedFamilies.set(key, family.id);
    const args = variant.arguments;
    if (args === null) {
      requireThat(!events.includes(family.category), `${label}: categoría de evento sin respuesta`);
      continue;
    }
    const parsed = proposalSchema.strict().safeParse(args);
    requireThat(parsed.success, `${label}: respuesta fuera del esquema (${parsed.error?.message})`);
    if (!parsed.success) continue;
    requireThat(Object.hasOwn(args, 'equipo') && schema.properties.equipo.enum.includes(args.equipo), `${label}: equipo canónico obligatorio`);
    requireThat(args.evento === family.category || (!events.includes(family.category) && args.evento === 'desconocido'), `${label}: evento no corresponde a su categoría`);
    requireThat(!Object.hasOwn(args, 'penalti') || ['gol', 'parada', 'fallo'].includes(args.evento), `${label}: penalti incompatible`);
    requireThat(!Object.hasOwn(args, 'azul') || args.evento === 'descalificacion', `${label}: azul incompatible`);
    requireThat(!Object.hasOwn(args, 'infraccion') || (args.evento === 'infraccion' && ['Pasos', 'Dobles', 'Pisando'].includes(args.infraccion)), `${label}: subtipo incompatible`);
    requireThat(relatedEvents.has(args.evento) || (!Object.hasOwn(args, 'dorsal_relacionado') && !Object.hasOwn(args, 'nombre_relacionado')), `${label}: participante relacionado incompatible`);
    if (args.evento === 'pasivo') requireThat(Object.keys(args).every(key => ['evento', 'equipo'].includes(key)), `${label}: pasivo solo tiene evento y equipo`);
    for (const field of ['nombre', 'nombre_relacionado']) {
      if (Object.hasOwn(args, field)) requireThat(typeof args[field] === 'string' && args[field].trim().length > 0 && variant.text.includes(args[field]), `${label}: ${field} no es literal en el texto`);
    }
    for (const field of ['dorsal', 'dorsal_relacionado']) {
      if (Object.hasOwn(args, field)) requireThat(numberIsMentioned(variant.text, args[field]), `${label}: ${field}=${args[field]} sin número literal en el texto`);
    }
  }
}
if (errors.length) throw new Error(`Dataset inválido:\n${errors.join('\n')}`);

const hash = value => createHash('sha256').update(value).digest('hex');
const splitSeed = 'bmano-voz-es-v1';
// Keep both abstentions and uncertain sports actions in every partition.
const strata = [...events, 'inciertos', 'rechazos'];
const familySplits = new Map();
for (const category of strata) {
  const families = seeds.filter(family => events.includes(category) ? family.category === category :
    !events.includes(family.category) && family.variants.some(variant => variant.arguments?.evento === 'desconocido') === (category === 'inciertos'))
    .sort((left, right) => hash(`${splitSeed}:${left.id}`).localeCompare(hash(`${splitSeed}:${right.id}`), 'en'));
  assert.equal(families.length, category === 'inciertos' ? 3 : category === 'rechazos' ? 32 : 15, `Cobertura de ${category}`);
  const testCount = category === 'inciertos' ? 1 : category === 'rechazos' ? 4 : 2;
  const validationCount = testCount;
  families.forEach((family, index) => familySplits.set(family.id, index < testCount ? 'test' : index < testCount + validationCount ? 'validation' : 'train'));
}

const rows = seeds.flatMap(family => family.variants.map((variant, index) => ({
  id: `${family.id}-${index + 1}`,
  query: variant.text,
  system: `locale:es; sport:handball; perspective:recorder; equipo1=${family.teams[0]}; equipo2=${family.teams[1]}; nuestro/nosotros/mi equipo=equipo1; ellos/rival/contrario/suyo=equipo2; local/visitante=sin perspectiva; equipo no mencionado=desconocido`,
  tools,
  answers: variant.arguments === null ? [] : [{ name: 'registrar_jugada', arguments: variant.arguments }],
  metadata: {
    family_id: family.id, category: family.category, split: familySplits.get(family.id),
    style: variant.style, teams: family.teams, annotation_note: family.reason,
    source: 'synthetic_text', author: 'gpt-6-luna', review: 'Codex; schema_and_manual', revision: 1,
  },
})));
assert.equal(rows.length, 600);
const count = (items, key) => Object.fromEntries([...new Set(items.map(key))].sort().map(value => [value, items.filter(item => key(item) === value).length]));
const calls = rows.flatMap(row => row.answers.map(call => call.arguments));
const nameValues = calls.flatMap(args => [args.nombre, args.nombre_relacionado].filter(Boolean));
const dorsals = [...new Set(calls.flatMap(args => [args.dorsal, args.dorsal_relacionado].filter(value => value !== undefined)))].sort((a, b) => a - b);
assert(dorsals.includes(0) && dorsals.includes(6) && dorsals.includes(99), 'Se requieren dorsales 0, 6 y 99');
assert(calls.some(args => args.nombre && args.dorsal === undefined), 'Faltan nombres sin dorsal');
assert(calls.some(args => args.nombre && args.dorsal !== undefined), 'Faltan nombres acompañados de dorsal');
assert(calls.some(args => args.dorsal_relacionado !== undefined) && calls.some(args => args.nombre_relacionado), 'Faltan participantes relacionados');
for (const event of events) {
  for (const team of ['equipo1', 'equipo2', 'desconocido']) assert(calls.some(args => args.evento === event && args.equipo === team), `${event}: falta ${team}`);
}
for (const kind of ['Pasos', 'Dobles', 'Pisando']) assert(calls.some(args => args.infraccion === kind), `Falta infracción ${kind}`);
for (const event of ['gol', 'parada', 'fallo']) assert(calls.some(args => args.evento === event && args.penalti), `Falta ${event} de siete metros`);
assert(calls.some(args => args.azul), 'Falta tarjeta azul');
assert(calls.some(args => args.evento === 'exclusion' && args.dorsal === undefined && args.nombre === undefined), 'Falta exclusión sin jugador');
for (const split of ['train', 'validation', 'test']) {
  assert(rows.some(row => row.metadata.split === split && row.answers.length === 0), `${split}: falta abstención`);
  assert(rows.some(row => row.metadata.split === split && row.answers[0]?.arguments.evento === 'desconocido'), `${split}: falta acción incierta`);
}

const stats = {
  version: 1, language: 'es', source: 'synthetic_text', author: 'gpt-6-luna', review: 'Codex; schema_and_manual',
  samples: rows.length, families: seeds.length,
  split_seed: splitSeed,
  splits: Object.fromEntries(['train', 'validation', 'test'].map(split => [split, {
    samples: rows.filter(row => row.metadata.split === split).length,
    families: new Set(rows.filter(row => row.metadata.split === split).map(row => row.metadata.family_id)).size,
    categories: count(rows.filter(row => row.metadata.split === split), row => row.metadata.category),
  }])),
  categories: count(rows, row => row.metadata.category),
  teams: count(calls, args => args.equipo),
  abstentions: rows.filter(row => !row.answers.length).length,
  styles: count(rows, row => row.metadata.style),
  primary_name_samples: calls.filter(args => args.nombre).length,
  primary_number_samples: calls.filter(args => args.dorsal !== undefined).length,
  primary_name_and_number_samples: calls.filter(args => args.nombre && args.dorsal !== undefined).length,
  related_name_samples: calls.filter(args => args.nombre_relacionado).length,
  unique_literal_names: [...new Set(nameValues)].sort(),
  shirt_numbers: dorsals,
  seed_sha256: hash(await readFile(resolve(directory, 'seeds.json'))),
};
const jsonl = items => items.map(item => JSON.stringify(item)).join('\n') + '\n';
const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const readable = '# Frases y etiquetas esperadas\n\nTexto sintético, no transcripciones observadas de Whistle. Los nombres son ficticios. Véase README.md para el criterio de anotación.\n\n' +
  '| ID | Partición | Transcripción | Argumentos esperados (vacío = abstención) |\n| --- | --- | --- | --- |\n' +
  rows.map(row => `| ${cell(row.id)} | ${row.metadata.split} | ${cell(row.query)} | ${cell(JSON.stringify(row.answers[0]?.arguments ?? []))} |`).join('\n') + '\n';
const files = new Map([
  ['dataset.jsonl', jsonl(rows)],
  ...['train', 'validation', 'test'].map(split => [`${split}.jsonl`, jsonl(rows.filter(row => row.metadata.split === split))]),
  ['tools.json', JSON.stringify(tools, null, 2) + '\n'],
  ['stats.json', JSON.stringify(stats, null, 2) + '\n'],
  ['frases.md', readable],
]);
await mkdir(directory, { recursive: true });
for (const [name, content] of files) {
  if (checkOnly) assert.equal(await readFile(resolve(directory, name), 'utf8'), content, `${name} desactualizado; ejecuta npm run dataset:build`);
  else await writeFile(resolve(directory, name), content);
}
const archiveFiles = new Map([...files, ['seeds.json', await readFile(resolve(directory, 'seeds.json'), 'utf8')], ['README.md', await readFile(resolve(directory, 'README.md'), 'utf8')]]);
const archive = zipSync(Object.fromEntries([...archiveFiles].map(([name, content]) => [`voz-es/${name}`, [strToU8(content), { mtime: new Date('2026-10-16T00:00:00Z') }]])), { level: 9 });
const archivePath = resolve(directory, '../voz-es.zip');
if (checkOnly) assert.deepEqual(await readFile(archivePath), Buffer.from(archive), 'voz-es.zip desactualizado');
else await writeFile(archivePath, archive);
console.log(`${checkOnly ? 'Validado' : 'Generado'}: ${rows.length} muestras / ${seeds.length} familias; ${events.length} eventos; sin fuga de familias entre particiones.`);
console.log(JSON.stringify({ splits: Object.fromEntries(Object.entries(stats.splits).map(([split, value]) => [split, value.samples])), abstentions: stats.abstentions, primaryNames: stats.primary_name_samples, namesWithDorsal: stats.primary_name_and_number_samples, shirtNumbers: dorsals }));
