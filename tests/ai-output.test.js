import test from 'node:test';
import assert from 'node:assert/strict';
import { getChatCompletionOutput } from '../src/ai/output.js';

test('getChatCompletionOutput returns assistant content', async () => {
  const client = {
    chat: {
      completions: {
        create: async () => ({
          choices: [
            { message: { content: 'hello' } }
          ]
        })
      }
    }
  };
  const text = await getChatCompletionOutput(client, 'model-x', 'payload');
  assert.equal(text, 'hello');
});

test('getChatCompletionOutput throws when content missing', async () => {
  const client = {
    chat: {
      completions: {
        create: async () => ({ choices: [] })
      }
    }
  };
  await assert.rejects(
    () => getChatCompletionOutput(client, 'model-x', 'payload'),
    /No content/
  );
});
