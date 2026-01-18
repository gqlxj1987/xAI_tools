import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv, fromCsv } from '../src/io/csv.js';

const sample = [
  {
    username: 'alice',
    tweet_id: '1',
    created_at: '2026-01-18T00:00:00Z',
    text: 'hello, world',
    original_url: 'https://x.com/a/status/1'
  }
];

test('toCsv and fromCsv round-trip', () => {
  const csv = toCsv(sample);
  const parsed = fromCsv(csv);
  assert.deepEqual(parsed, sample);
});
