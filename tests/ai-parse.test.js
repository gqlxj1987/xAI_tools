import test from 'node:test';
import assert from 'node:assert/strict';
import { withJsonRetry } from '../src/ai/parse.js';

const good = async () => '{"ok":true}';

test('withJsonRetry returns parsed json', async () => {
  const out = await withJsonRetry(good, 1);
  assert.equal(out.ok, true);
});
