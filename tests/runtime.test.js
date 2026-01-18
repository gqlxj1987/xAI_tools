import test from 'node:test';
import assert from 'node:assert/strict';
import { getRuntimeConfig } from '../src/config/runtime.js';

test('getRuntimeConfig returns defaults', () => {
  const cfg = getRuntimeConfig({});
  assert.equal(cfg.model, 'mimo-v2-flash');
  assert.equal(cfg.promptPath, 'prompts/grok_tasks_prompt.txt');
  assert.ok(cfg.timeZone);
  assert.equal(cfg.headless, true);
});
