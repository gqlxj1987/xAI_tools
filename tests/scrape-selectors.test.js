import test from 'node:test';
import assert from 'node:assert/strict';
import { requiredSelectors } from '../src/config/selectors.js';
import { connectCdp } from '../src/scrape/cdp.js';
import { getDateKey, filterTasksByLocalDate } from '../src/scrape/tasks.js';

test('required selectors are defined', () => {
  for (const key of requiredSelectors) {
    assert.ok(key);
  }
});

test('connectCdp is a function', () => {
  assert.equal(typeof connectCdp, 'function');
});

test('filterTasksByLocalDate filters by date string', () => {
  const rows = [
    { tweet_id: '1', created_at: '2026-01-18T01:00:00Z' },
    { tweet_id: '2', created_at: '2026-01-17T23:00:00Z' }
  ];
  const filtered = filterTasksByLocalDate(rows, '2026-01-18', 'UTC');
  assert.deepEqual(filtered.map((row) => row.tweet_id), ['1']);
});

test('getDateKey returns yyyy-mm-dd in UTC', () => {
  const key = getDateKey('2026-01-18T01:00:00Z', 'UTC');
  assert.equal(key, '2026-01-18');
});
