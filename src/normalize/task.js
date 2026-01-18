export function normalizeTask(task) {
  const normalize = (value) => typeof value === 'string' ? value.trim() : value;
  const createdAt = new Date(task.created_at).toISOString().replace('.000Z', 'Z');
  return {
    username: normalize(task.username),
    tweet_id: normalize(task.tweet_id),
    created_at: createdAt,
    text: normalize(task.text),
    original_url: normalize(task.original_url),
  };
}
