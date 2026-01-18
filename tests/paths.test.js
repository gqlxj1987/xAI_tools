import test from 'node:test';
import assert from 'node:assert/strict';
import { getOutputPaths } from '../src/config/paths.js';

test('getOutputPaths returns date-based file paths', () => {
  const paths = getOutputPaths('2026-01-18');
  assert.equal(paths.rawCsv, 'data/raw/tasks_2026-01-18.csv');
  assert.equal(paths.summaryMd, 'data/parsed/tasks_2026-01-18.md');
});
