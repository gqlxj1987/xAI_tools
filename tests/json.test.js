import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonStrict } from '../src/ai/json.js';

test('parseJsonStrict returns object on valid json', () => {
  const obj = parseJsonStrict('{"a":1}');
  assert.equal(obj.a, 1);
});
