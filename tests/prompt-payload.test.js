import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptPayload } from '../src/ai/prompt.js';

test('buildPromptPayload appends markdown instruction', () => {
  const payload = buildPromptPayload('PROMPT', 'INPUT');
  assert.ok(payload.includes('Return ONLY Markdown'));
  assert.ok(payload.includes('INPUT'));
});
