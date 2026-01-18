export function getCdpEndpoint(env) {
  if (env.CDP_ENDPOINT && env.CDP_ENDPOINT.trim()) {
    return env.CDP_ENDPOINT.trim();
  }
  if (env.CDP_PORT && String(env.CDP_PORT).trim()) {
    return `http://127.0.0.1:${String(env.CDP_PORT).trim()}`;
  }
  return 'http://127.0.0.1:9222';
}
