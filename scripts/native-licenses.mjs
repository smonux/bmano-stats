import { readFile, readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const packages = [];
await mkdir('docs/stores/licenses/texts', { recursive: true });
for (const [path, dependency] of Object.entries(lock.packages)) {
  if (!path || dependency.dev || dependency.devOptional) continue;
  let names;
  try {
    names = await readdir(path);
  } catch {
    continue;
  }
  const pkg = JSON.parse(await readFile(`${path}/package.json`, 'utf8'));
  const texts = [];
  for (const name of names.filter((name) => /^(licen[cs]e|notice|copying)([.-]|$)/i.test(name))) {
    const target = `${pkg.name.replaceAll('/', '_')}@${pkg.version}-${name}`;
    try {
      const bytes = await readFile(`${path}/${name}`);
      await copyFile(`${path}/${name}`, `docs/stores/licenses/texts/${target}`);
      texts.push({
        file: `texts/${target}`,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    } catch {
      /* Some packages use a LICENSE directory instead of a file; flag below. */
    }
  }
  packages.push({
    name: pkg.name,
    version: pkg.version,
    license: pkg.license ?? dependency.license ?? 'REVIEW',
    repository: pkg.repository ?? null,
    texts,
  });
}
await writeFile(
  'docs/stores/licenses/npm-production.json',
  JSON.stringify(
    {
      scope:
        'Installed npm production dependency closure; native Maven/SPM resolution must also be audited',
      packages,
    },
    null,
    2,
  ),
);
await copyFile(
  'node_modules/cactus-needle/vendor/LICENSE',
  'docs/stores/licenses/cactus-runtime-Apache-2.0.txt',
);
await copyFile('node_modules/cactus-needle/NOTICE', 'docs/stores/licenses/cactus-NOTICE.txt');
console.log(
  `${packages.length} installed npm production packages inventoried; ${packages.filter((pkg) => !pkg.texts.length).length} need license-text review.`,
);
