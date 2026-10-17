import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { strToU8, zipSync } from 'fflate';

function datasetFiles(rows, tools, stats) {
  const jsonl = (items) => items.map((item) => JSON.stringify(item)).join('\n') + '\n';
  const cell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const readable =
    '# Frases y etiquetas esperadas\n\nTexto sintético, no transcripciones observadas de Whistle. Los nombres son ficticios. Véase README.md para el criterio de anotación.\n\n' +
    '| ID | Partición | Transcripción | Argumentos esperados (vacío = abstención) |\n| --- | --- | --- | --- |\n' +
    rows
      .map(
        (row) =>
          `| ${cell(row.id)} | ${row.metadata.split} | ${cell(row.query)} | ${cell(JSON.stringify(row.answers[0]?.arguments ?? []))} |`,
      )
      .join('\n') +
    '\n';
  const files = new Map([
    ['dataset.jsonl', jsonl(rows)],
    ...['train', 'validation', 'test'].map((split) => [
      `${split}.jsonl`,
      jsonl(rows.filter((row) => row.metadata.split === split)),
    ]),
    ['tools.json', JSON.stringify(tools, null, 2) + '\n'],
    ['stats.json', JSON.stringify(stats, null, 2) + '\n'],
    ['frases.md', readable],
  ]);
  return files;
}

export async function writeDatasetArtifacts(directory, rows, tools, stats, checkOnly) {
  const files = datasetFiles(rows, tools, stats);
  await mkdir(directory, { recursive: true });
  for (const [name, content] of files) {
    if (checkOnly) {
      assert.equal(
        await readFile(resolve(directory, name), 'utf8'),
        content,
        `${name} desactualizado; ejecuta npm run dataset:build`,
      );
    } else {
      await writeFile(resolve(directory, name), content);
    }
  }
  const archiveFiles = new Map([
    ...files,
    ['seeds.json', await readFile(resolve(directory, 'seeds.json'), 'utf8')],
    ['README.md', await readFile(resolve(directory, 'README.md'), 'utf8')],
  ]);
  const archive = zipSync(
    Object.fromEntries(
      [...archiveFiles].map(([name, content]) => [
        `voz-es/${name}`,
        [strToU8(content), { mtime: new Date('2026-10-16T00:00:00Z') }],
      ]),
    ),
    { level: 9 },
  );
  const archivePath = resolve(directory, '../voz-es.zip');
  if (checkOnly) {
    assert.deepEqual(
      await readFile(archivePath),
      Buffer.from(archive),
      'voz-es.zip desactualizado',
    );
  } else {
    await writeFile(archivePath, archive);
  }
}
