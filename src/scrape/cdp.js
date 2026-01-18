import { chromium } from 'playwright';
import { getCdpEndpoint } from '../config/cdp.js';

const LOCALHOSTS = ['127.0.0.1', 'localhost', '::1'];

export function ensureNoProxyForLocalhost(env) {
  const current = env.NO_PROXY || env.no_proxy || '';
  const entries = current.split(',').map((entry) => entry.trim()).filter(Boolean);
  for (const host of LOCALHOSTS) {
    if (!entries.includes(host)) {
      entries.push(host);
    }
  }
  return entries.join(',');
}

export async function disconnectCdpBrowser(browser) {
  if (!browser) {
    return;
  }
  if (typeof browser.close === 'function') {
    await browser.close();
  }
}

export async function connectCdp(env) {
  const noProxy = ensureNoProxyForLocalhost(env);
  process.env.NO_PROXY = noProxy;
  process.env.no_proxy = noProxy;
  const endpoint = getCdpEndpoint(env);
  return chromium.connectOverCDP(endpoint);
}
