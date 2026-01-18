import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCsvFromMessage, parseCsvFromMessage } from '../src/parse/task-csv.js';

const messageWithFence = `Here is data:\n\n\`\`\`csv\nusername,tweet_id,created_at,text,original_url\nfoo,1,2026-01-18T00:00:00Z,\"hello\",https://x.com/foo/status/1\n\`\`\``;

const messageWithoutFence = `username,tweet_id,created_at,text,original_url\nbar,2,2026-01-18T01:00:00Z,\"hi\",https://x.com/bar/status/2`;

test('extractCsvFromMessage returns csv block inside fence', () => {
  const csv = extractCsvFromMessage(messageWithFence);
  assert.ok(csv.startsWith('username,tweet_id'));
});

test('extractCsvFromMessage returns csv from plain text', () => {
  const csv = extractCsvFromMessage(messageWithoutFence);
  assert.ok(csv.startsWith('username,tweet_id'));
});

test('parseCsvFromMessage parses rows', () => {
  const rows = parseCsvFromMessage(messageWithFence);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tweet_id, '1');
});

test('parseCsvFromMessage ignores trailing commentary', () => {
  const message = `${messageWithoutFence}\n\nSome trailing summary line without commas.`;
  const rows = parseCsvFromMessage(message);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tweet_id, '2');
});
