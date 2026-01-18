export async function withOutputRetry(fetchFn, retries) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const text = await fetchFn();
      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Empty output');
      }
      return text;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
