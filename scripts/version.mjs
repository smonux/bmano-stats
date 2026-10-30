import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const files = [
  'package.json',
  'package-lock.json',
  'android/app/build.gradle',
  'ios/App/App.xcodeproj/project.pbxproj',
  'docs/stores/listings.json',
];
const contents = await Promise.all(
  files.map((file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')),
);
const [packageText, lockText, android, ios, listingsText] = contents;
const manifest = JSON.parse(packageText);
const request = process.argv[2];
const [major, minor] = manifest.version.split('.').map(Number);
const version = request === 'minor' ? `${major}.${minor + 1}.0` : request;
assert(
  version && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version),
  'Use version.mjs minor or version.mjs MAJOR.MINOR.PATCH',
);
assert.match(android, /versionCode \d+/);
assert.match(android, /versionName "[^"]+"/);
assert.match(ios, /CURRENT_PROJECT_VERSION = \d+;/);
assert.match(ios, /MARKETING_VERSION = [^;]+;/);
const previousBuild = Math.max(
  Number(android.match(/versionCode (\d+)/)[1]),
  ...[...ios.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((match) => Number(match[1])),
);
const build = previousBuild + (manifest.version === version ? 0 : 1);
manifest.version = version;
const lock = JSON.parse(lockText);
lock.version = version;
lock.packages[''].version = version;
const listings = JSON.parse(listingsText);
listings.version = version;
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const replacements = [
  json(manifest),
  json(lock),
  android
    .replace(/versionName "[^"]+"/, `versionName "${version}"`)
    .replace(/versionCode \d+/, `versionCode ${build}`),
  ios
    .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
    .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${build};`),
  json(listings),
];
for (let index = 0; index < files.length; index++)
  await writeFile(new URL(`../${files[index]}`, import.meta.url), replacements[index]);
console.log(
  `Version ${version}; Android/iOS build ${build}; package, lockfile and store metadata synchronized.`,
);
