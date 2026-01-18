import { parseJsonStrict } from './json.js';

export async function withJsonRetry(fetchFn, retries) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const text = await fetchFn();
      return parseJsonStrict(text);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
