import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptInput } from '../src/ai/prompt.js';

const rows = [
  { username: 'a', tweet_id: '1', created_at: '2026-01-18T00:00:00Z', text: 't', original_url: 'u' }
];

test('buildPromptInput injects ID markers', () => {
  const out = buildPromptInput(rows);
  assert.ok(out.includes('[ID: 1]'));
});
