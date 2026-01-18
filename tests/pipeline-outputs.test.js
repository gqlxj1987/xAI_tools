import test from 'node:test';
import assert from 'node:assert/strict';
import { planOutputFiles } from '../src/pipeline/run.js';

test('planOutputFiles returns raw and parsed paths', () => {
  const out = planOutputFiles('2026-01-18');
  assert.equal(out.rawCsv, 'data/raw/tasks_2026-01-18.csv');
});
