export function getRuntimeConfig(env) {
  return {
    model: env.OPENAI_MODEL?.trim() || 'mimo-v2-flash',
    promptPath: env.PROMPT_PATH?.trim() || 'prompts/grok_tasks_prompt.txt',
  };
}
