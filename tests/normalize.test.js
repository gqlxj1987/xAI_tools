import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTask } from '../src/normalize/task.js';

test('normalizeTask trims fields and enforces utc string', () => {
  const input = {
    username: '  bob ',
    tweet_id: ' 42 ',
    created_at: '2026-01-18T00:00:00.000Z',
    text: ' hello ',
    original_url: ' https://x.com/b/status/42 '
  };
  const out = normalizeTask(input);
  assert.equal(out.username, 'bob');
  assert.equal(out.tweet_id, '42');
  assert.equal(out.created_at, '2026-01-18T00:00:00Z');
  assert.equal(out.text, 'hello');
  assert.equal(out.original_url, 'https://x.com/b/status/42');
});
