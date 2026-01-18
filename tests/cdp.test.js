import test from 'node:test';
import assert from 'node:assert/strict';
import { getCdpEndpoint } from '../src/config/cdp.js';

test('getCdpEndpoint uses default port when not set', () => {
  const endpoint = getCdpEndpoint({});
  assert.equal(endpoint, 'http://127.0.0.1:9222');
});
