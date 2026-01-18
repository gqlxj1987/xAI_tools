import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIClient } from '../src/ai/client.js';

test('createOpenAIClient throws when api key missing', () => {
  assert.throws(() => createOpenAIClient({}), /OPENAI_API_KEY/);
});
