import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { DEFAULT_SPEECH_MODEL } from 'cactus-needle';

const result = spawnSync('npx', ['vite', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_NATIVE_BUNDLE: 'true' },
});
if (result.status !== 0) process.exit(result.status ?? 1);
await rm('dist-native/models', { recursive: true, force: true });
await mkdir('dist-native/models', { recursive: true });
const target = 'dist-native/models/whistle.cact';
const source = process.env.WHISTLE_MODEL_PATH ?? 'node_modules/.cache/voice-models/whistle.cact';
let weights;
try {
  weights = await readFile(source);
} catch {
  const response = await fetch(DEFAULT_SPEECH_MODEL.url);
  if (!response.ok) throw new Error(`Whistle download: ${response.status}`);
  weights = Buffer.from(await response.arrayBuffer());
}
if (
  weights.length !== DEFAULT_SPEECH_MODEL.size ||
  createHash('sha256').update(weights).digest('hex') !== DEFAULT_SPEECH_MODEL.sha256
)
  throw new Error('Whistle integrity mismatch; native build aborted.');
await writeFile(target, weights);
// The native build contains only Whistle, never the unused Needle variants.
await writeFile('dist-native/models/manifest.json', JSON.stringify(DEFAULT_SPEECH_MODEL, null, 2));
await mkdir('dist-native/licenses', { recursive: true });
await copyFile('node_modules/cactus-needle/LICENSE', 'dist-native/licenses/cactus-needle.txt');
await copyFile(
  'node_modules/cactus-needle/vendor/LICENSE',
  'dist-native/licenses/cactus-runtime.txt',
);
await copyFile('node_modules/cactus-needle/NOTICE', 'dist-native/licenses/cactus-NOTICE.txt');
await copyFile(
  'docs/stores/licenses/whistle-Apache-2.0.txt',
  'dist-native/licenses/whistle-Apache-2.0.txt',
);
await copyFile('LICENSE', 'dist-native/licenses/handball-stats.txt');
await cp('docs/stores/licenses/texts', 'dist-native/licenses/npm', { recursive: true });
await copyFile(
  'docs/stores/licenses/npm-production.json',
  'dist-native/licenses/npm-production.json',
);
let html = await readFile('dist-native/index.html', 'utf8');
html = html.replace(
  '<head>',
  `<head><meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob: capacitor:; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' capacitor:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:">`,
);
await writeFile('dist-native/index.html', html);
console.log(`Bundled Whistle: ${weights.length} bytes, SHA-256 verified. No remote app URL.`);
