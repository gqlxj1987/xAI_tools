export function getRuntimeConfig(env) {
  return {
    model: env.OPENAI_MODEL?.trim() || 'mimo-v2-flash',
    promptPath: env.PROMPT_PATH?.trim() || 'prompts/grok_tasks_prompt.txt',
    timeZone: env.TASKS_TIMEZONE?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone,
    headless: env.HEADLESS !== 'false'
  };
}
