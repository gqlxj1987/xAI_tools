export async function fetchTasks(page) {
  return page.evaluate(async () => {
    const resp = await fetch('/rest/tasks');
    return resp.json();
  });
}

export async function fetchLatestTaskResult(page, taskId) {
  return page.evaluate(async (id) => {
    const resp = await fetch(`/rest/tasks/results/${id}?limit=1`);
    return resp.json();
  }, taskId);
}

export async function fetchConversationResponses(page, conversationId) {
  return page.evaluate(async (id) => {
    const nodeResp = await fetch(`/rest/app-chat/conversations/${id}/response-node?includeThreads=true`);
    const nodeJson = await nodeResp.json();
    const responseIds = (nodeJson.responseNodes || []).map((node) => node.responseId);
    const loadResp = await fetch(`/rest/app-chat/conversations/${id}/load-responses`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ responseIds })
    });
    return loadResp.json();
  }, conversationId);
}
