export async function getChatCompletionOutput(client, model, payload) {
  const result = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: payload }]
  });
  const content = result?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in chat completion response');
  }
  return content;
}
