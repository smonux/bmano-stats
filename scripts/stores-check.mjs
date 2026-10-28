import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const listings = JSON.parse(await readFile('docs/stores/listings.json', 'utf8'));
assert.equal(Object.keys(listings.locales).length, 7);
for (const [locale, row] of Object.entries(listings.locales)) {
  for (const [key, max] of Object.entries({
    title: 30,
    subtitle: 30,
    shortDescription: 80,
    description: 4000,
    releaseNotes: 4000,
  })) {
    assert(row[key]?.trim(), `${locale}: empty ${key}`);
    assert([...row[key]].length <= max, `${locale}: ${key} exceeds ${max}`);
  }
  assert(Buffer.byteLength(row.keywords, 'utf8') <= 100, `${locale}: keywords exceed 100 bytes`);
  console.log(
    `${locale}: title ${[...row.title].length}, short ${[...row.shortDescription].length}, subtitle ${[...row.subtitle].length}, description ${[...row.description].length}, keywords ${Buffer.byteLength(row.keywords)} bytes`,
  );
}
const config = JSON.parse(await readFile('capacitor.config.json', 'utf8'));
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
assert.equal(listings.version, version);
const gradle = await readFile('android/app/build.gradle', 'utf8');
assert(gradle.includes(`versionName "${version}"`), 'Android version mismatch');
const xcode = await readFile('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
assert(xcode.includes(`MARKETING_VERSION = ${version};`), 'iOS version mismatch');
assert.equal(config.webDir, 'dist-native');
assert(!config.server.url, 'Never ship a remote website URL');
assert(!config.server.allowNavigation, 'External navigation must not be whitelisted');
const manifest = await readFile('android/app/src/main/AndroidManifest.xml', 'utf8');
const permissions = [...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)].map(
  (match) => match[1],
);
assert.deepEqual(
  permissions.sort(),
  ['INTERNET', 'MODIFY_AUDIO_SETTINGS', 'RECORD_AUDIO']
    .map((name) => `android.permission.${name}`)
    .sort(),
);
const plist = await readFile('ios/App/App/Info.plist', 'utf8');
assert(
  !/NSSpeechRecognitionUsageDescription|NSCameraUsageDescription|UIBackgroundModes/.test(plist),
);
assert(plist.includes('NSMicrophoneUsageDescription'));
console.log(
  'Source manifests checked. Use mobile:verify:android for compiled Android containers; the iOS archive audit requires macOS.',
);
