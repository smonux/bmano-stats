// Exports a read-only Git snapshot to a temporary folder. No models, servers or training.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm, symlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVoiceModule } from './lib/voice-bundle.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const reference = process.argv[2] ?? '6805b02';
if (process.argv.length > 3) {
  throw new Error('Uso: npm run voice:compare -- [referencia-git]');
}
const run = promisify(execFile);
const { stdout } = await run(
  'git',
  ['rev-parse', '--verify', '--end-of-options', `${reference}^{commit}`],
  { cwd: root },
);
const referenceCommit = stdout.trim();
const directory = await mkdtemp(join(tmpdir(), 'bmano-voice-reference-'));

try {
  const archive = join(directory, 'source.tar');
  await run('git', ['archive', '--format=tar', `--output=${archive}`, referenceCommit, 'src'], {
    cwd: root,
  });
  await run('tar', ['-xf', archive, '-C', directory]);
  await symlink(resolve(root, 'node_modules'), join(directory, 'node_modules'), 'dir');
  const before = await loadVoiceModule(join(directory, 'src/voice/deterministic.ts'));
  const after = await loadVoiceModule(resolve(root, 'src/voice/deterministic.ts'));
  const beforeNumbers = await loadVoiceModule(join(directory, 'src/voice/numbers.ts'));
  const afterNumbers = await loadVoiceModule(resolve(root, 'src/voice/numbers.ts'));
  const beforeKeywords = await loadVoiceModule(join(directory, 'src/voice/keywords.ts'));
  const afterKeywords = await loadVoiceModule(resolve(root, 'src/voice/keywords.ts'));
  const beforeLexicon = await loadVoiceModule(join(directory, 'src/voice/lexicon.ts'));
  const afterLexicon = await loadVoiceModule(resolve(root, 'src/voice/lexicon.ts'));
  const languages = Object.keys(beforeLexicon.exports.lexicons);
  let preservedNumberSpellings = 0;
  const roster = Array.from({ length: 100 }, (_, dorsal) => ({
    name: `Jugador ${dorsal}`,
    dorsal,
  }));
  roster.push({ name: 'Jugador 0', dorsal: 0 }, { name: 'Ana\nMaría', dorsal: null });
  for (const language of languages) {
    const originalRules = beforeLexicon.exports.lexicons[language];
    const currentRules = afterLexicon.exports.lexicons[language];
    for (const [key, value] of Object.entries(originalRules)) {
      const current =
        key === 'stop' && !currentRules.stop ? currentRules.stopWords.join(' ') : currentRules[key];
      assert.deepEqual(current, value, `${language}.${key}`);
    }
    assert.deepEqual(
      afterKeywords.exports.whistleKeywords(language, ['La Jota', 'Águilas'], roster),
      beforeKeywords.exports.whistleKeywords(language, ['La Jota', 'Águilas'], roster),
    );
    for (let number = 0; number < 100; number++) {
      assert.equal(
        afterNumbers.exports.spokenNumber(number, language),
        beforeNumbers.exports.spokenNumber(number, language),
      );
      preservedNumberSpellings++;
    }
    assert.deepEqual(
      [...afterNumbers.exports.numberDictionary(language)],
      [...beforeNumbers.exports.numberDictionary(language)],
    );
  }
  const dataset = await readFile(resolve(root, 'datasets/voz-es/dataset.jsonl'), 'utf8');
  const samples = dataset.trim().split('\n').map(JSON.parse);
  for (const sample of samples) {
    assert.deepEqual(interpret(after, sample), interpret(before, sample), sample.id);
  }
  const times = { before: [], after: [] };
  const interpreters = { before, after };
  const rounds = 12;
  // Equality checks above warm both interpreters. Alternate order to reduce timing bias.
  for (let round = 0; round < rounds; round++) {
    const order = round % 2 ? ['after', 'before'] : ['before', 'after'];
    for (const name of order) {
      for (const sample of samples) {
        const start = performance.now();
        interpret(interpreters[name], sample);
        times[name].push(performance.now() - start);
      }
    }
  }
  const report = {
    referenceCommit,
    date: new Date().toISOString(),
    runtime: process.version,
    method: `Same process, warmed interpreters, ${rounds} alternating full-corpus rounds. Text only; no audio/Whistle timing.`,
    preserved: {
      corpusOutputs: samples.length,
      languageVocabularies: languages.length,
      whistleKeywordLists: languages.length,
      numberSpellings: preservedNumberSpellings,
      numberDictionaries: languages.length,
    },
    implementationSha256: { before: hash(before.code), after: hash(after.code) },
    timingMs: { before: summarize(times.before), after: summarize(times.after) },
  };
  const destination = resolve(root, 'docs/benchmarks/reglas');
  await mkdir(destination, { recursive: true });
  await writeFile(join(destination, 'refactor.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await rm(directory, { recursive: true, force: true });
}

function interpret(module, sample) {
  return module.exports.interpretDeterministically(sample.query, 'es', sample.metadata.teams);
}
function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}
function summarize(times) {
  const sorted = times.toSorted((left, right) => left - right);
  return {
    samples: sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    mean: sorted.reduce((total, time) => total + time, 0) / sorted.length,
  };
}
