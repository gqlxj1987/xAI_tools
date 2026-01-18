export function buildPromptInput(rows) {
  return rows.map((row) => {
    return [
      `[ID: ${row.tweet_id}]`,
      `Author: ${row.username}`,
      `Created: ${row.created_at}`,
      `Text: ${row.text}`,
      `URL: ${row.original_url}`,
      ''
    ].join('\n');
  }).join('\n');
}

export function buildPromptPayload(promptTemplate, input) {
  return [
    promptTemplate,
    '',
    'Return ONLY Markdown that follows the requested sections.',
    'No JSON, no code fences, no extra commentary.',
    '',
    input
  ].join('\n');
}
