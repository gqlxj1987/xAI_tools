import test from 'node:test';
import assert from 'node:assert/strict';
import { withOutputRetry } from '../src/ai/parse.js';

const good = async () => 'ok';

test('withOutputRetry returns non-empty text', async () => {
  const out = await withOutputRetry(good, 1);
  assert.equal(out, 'ok');
});
