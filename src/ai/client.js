import OpenAI from 'openai';

export function createOpenAIClient(env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  const baseURL = env.OPENAI_BASE_URL?.trim();
  return new OpenAI({ apiKey, baseURL: baseURL || undefined });
}
