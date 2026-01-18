import { chromium } from 'playwright';
import { getCdpEndpoint } from '../config/cdp.js';

export async function connectCdp(env) {
  const endpoint = getCdpEndpoint(env);
  return chromium.connectOverCDP(endpoint);
}
