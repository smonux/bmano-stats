import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat, readdir, rm, copyFile } from 'node:fs/promises';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
await mkdir('artifacts/mobile', { recursive: true });
let androidVerification;
try {
  androidVerification = JSON.parse(
    await readFile('artifacts/mobile/logs/android-verification.json', 'utf8'),
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const binaries = {};
for (const [kind, source, expectedEntry, suffix] of [
  ['apk', 'android/app/build/outputs/apk/debug/app-debug.apk', 'AndroidManifest.xml', 'debug.apk'],
  [
    'aab',
    'android/app/build/outputs/bundle/release/app-release.aab',
    'base/manifest/AndroidManifest.xml',
    'release-unsigned.aab',
  ],
]) {
  let exists = false;
  try {
    exists = (await stat(source)).isFile();
  } catch {}
  if (!exists) {
    binaries[kind] = {
      produced: false,
      reason: 'Android build output unavailable; see logs/android-build.log',
    };
    continue;
  }
  const archive = spawnSync('unzip', ['-Z1', source], { encoding: 'utf8' });
  if (archive.status !== 0 || !archive.stdout.split('\n').includes(expectedEntry))
    throw new Error(`${source} is not the expected compiled Android container`);
  const bytes = await readFile(source);
  const verified = androidVerification?.artifacts[kind];
  if (
    !verified ||
    verified.bytes !== bytes.length ||
    verified.sha256 !== createHash('sha256').update(bytes).digest('hex')
  )
    throw new Error(`Run npm run mobile:verify:android before packaging ${source}`);
  const path = `artifacts/mobile/handball-stats-${version}-${suffix}`;
  await copyFile(source, path);
  binaries[kind] = {
    produced: true,
    path,
    variant: verified.variant,
    signing: verified.signing,
    verificationReport: 'artifacts/mobile/logs/android-verification.json',
    installedOnDevice: androidVerification.installedOnDevice,
    nativeRuntimeTested: androidVerification.nativeRuntimeTested,
  };
}
const archives = [
  {
    name: `handball-stats-native-projects-${version}.zip`,
    inputs: [
      'android',
      'ios',
      'dist-native',
      'src',
      'tests',
      'public',
      'scripts',
      'docs/stores',
      'package.json',
      'package-lock.json',
      'capacitor.config.json',
      'vite.config.ts',
      'tsconfig.json',
      'playwright.config.ts',
      'playwright.native.config.ts',
      'playwright.review.config.ts',
      'playwright.stores.config.ts',
      'index.html',
      'handball-stats-icon.svg',
      'LICENSE',
      'README.md',
      '.prettierrc.json',
    ],
    excludes: [
      '*/build/*',
      '*/.gradle/*',
      '*/xcuserdata/*',
      '*/local.properties',
      'android/app/src/main/assets/public/*',
      'ios/App/App/public/*',
      'public/models/*',
      '*.keystore',
      '*.jks',
      '*.p12',
      '*.mobileprovision',
    ],
  },
  {
    name: `handball-stats-store-material-${version}.zip`,
    inputs: ['docs/stores', 'artifacts/stores/screenshots'],
    excludes: [],
  },
];
for (const archive of archives) {
  const target = `artifacts/mobile/${archive.name}`;
  await rm(target, { force: true });
  const result = spawnSync(
    'zip',
    [
      '-q',
      '-r',
      target,
      ...archive.inputs,
      ...(archive.excludes.length ? ['-x', ...archive.excludes] : []),
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error(`Packaging failed: ${target}`);
}
async function files(root) {
  const list = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory()) list.push(...(await files(path)));
    else list.push(path);
  }
  return list;
}
const artifacts = [];
for (const path of (await files('artifacts/mobile')).filter(
  (path) => !path.endsWith('/manifest.json') && !path.endsWith('/SHA256SUMS'),
)) {
  const bytes = await readFile(path);
  artifacts.push({
    path,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
const assets = await files('dist-native');
const modelFiles = assets.filter((path) => path.endsWith('.cact'));
if (modelFiles.length !== 1 || modelFiles[0] !== 'dist-native/models/whistle.cact')
  throw new Error('The mobile bundle must contain exactly one Whistle and no Needle weights');
let rawBytes = 0;
for (const path of assets) rawBytes += (await stat(path)).size;
const manifest = {
  version,
  generatedAt: new Date().toISOString(),
  artifacts,
  nativeWebAssetsBytes: rawBytes,
  modelFiles,
  apk: binaries.apk,
  aab: binaries.aab,
  ipa: { produced: false, reason: 'Linux: no macOS/Xcode/Apple signing; source ZIP is not an IPA' },
  installedSizeBytes: null,
  storeDownloadSizeBytes: null,
  warning:
    'Container byte sizes and raw web assets are measured. Installed/store sizes and native runtime compatibility remain unmeasured until installation and native QA.',
};
await writeFile('artifacts/mobile/manifest.json', JSON.stringify(manifest, null, 2));
await writeFile(
  'artifacts/mobile/SHA256SUMS',
  artifacts.map((item) => `${item.sha256}  ${item.path}`).join('\n') + '\n',
);
console.log(JSON.stringify(manifest, null, 2));
