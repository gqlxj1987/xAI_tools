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
