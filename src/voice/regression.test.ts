import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import baseline from './fixtures/regression-baseline.json';
import { interpretDeterministically } from './deterministic';

describe('interpreter behavior before the readability refactor', () => {
  test('the reference covers the complete, unchanged Spanish corpus', () => {
    const dataset = readFileSync('datasets/voz-es/dataset.jsonl');
    expect(createHash('sha256').update(dataset).digest('hex')).toBe(baseline.datasetSha256);
    const sampleIds = dataset
      .toString()
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line).id);
    expect(baseline.samples.map((sample) => sample.id)).toEqual(sampleIds);
  });

  test.each(baseline.samples)('$id: $text', ({ text, teams, result }) => {
    expect(interpretDeterministically(text, 'es', teams)).toEqual(result);
  });
});
