import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPipelineInput } from '../src/pipeline/run.js';

test('buildPipelineInput assembles prompt input', () => {
  const out = buildPipelineInput([
    { tweet_id: '1', username: 'a', created_at: 't', text: 'x', original_url: 'u' }
  ]);
  assert.ok(out.includes('[ID: 1]'));
});
