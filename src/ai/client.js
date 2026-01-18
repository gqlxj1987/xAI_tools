import OpenAI from 'openai';

export function createOpenAIClient(env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  const rawBaseURL = env.OPENAI_BASE_URL?.trim();
  let baseURL = rawBaseURL || undefined;
  if (baseURL && !baseURL.endsWith('/v1')) {
    baseURL = `${baseURL.replace(/\/+$/, '')}/v1`;
  }
  return new OpenAI({ apiKey, baseURL });
}
