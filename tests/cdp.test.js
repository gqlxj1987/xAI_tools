import test from 'node:test';
import assert from 'node:assert/strict';
import { getCdpEndpoint } from '../src/config/cdp.js';
import { ensureNoProxyForLocalhost } from '../src/scrape/cdp.js';

test('getCdpEndpoint uses default port when not set', () => {
  const endpoint = getCdpEndpoint({});
  assert.equal(endpoint, 'http://127.0.0.1:9222');
});

test('ensureNoProxyForLocalhost appends localhost entries', () => {
  const value = ensureNoProxyForLocalhost({ NO_PROXY: 'example.com' });
  assert.ok(value.includes('example.com'));
  assert.ok(value.includes('127.0.0.1'));
  assert.ok(value.includes('localhost'));
  assert.ok(value.includes('::1'));
});
