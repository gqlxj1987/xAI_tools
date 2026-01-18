# Grok Tasks Pipeline Implementation Plan

> 备注：当前实现已调整为输出 Markdown（非 JSON），且抓取阶段改为在页面上下文内调用内部接口获取数据。本文档保留为历史实现规划参考。

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js + Playwright (CDP) pipeline that scrapes today's grok.com/tasks into CSV, then uses OpenAI to generate structured JSON.

**Architecture:** Two-stage pipeline: (1) Playwright connects over CDP to an existing Chrome instance, navigates to tasks, performs login if needed, scrolls and extracts DOM into normalized records and CSV; (2) CSV → prompt input → OpenAI parse → JSON output with validation and retries. Configurable selectors and paths keep UI coupling isolated. Script does not launch Chrome itself.

**Tech Stack:** Node.js (ESM), Playwright (connectOverCDP), OpenAI SDK, dotenv, csv (parse/stringify), node:test.

### Task 1: Project scaffold and config

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `src/config/paths.js`
- Create: `src/config/selectors.js`
- Create: `src/config/runtime.js`
- Create: `src/config/cdp.js`
- Create: `prompts/grok_tasks_prompt.txt`
- Test: `tests/paths.test.js`
- Test: `tests/cdp.test.js`

**Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getOutputPaths } from '../src/config/paths.js';

test('getOutputPaths returns date-based file paths', () => {
  const paths = getOutputPaths('2026-01-18');
  assert.equal(paths.rawCsv, 'data/raw/tasks_2026-01-18.csv');
  assert.equal(paths.parsedJson, 'data/parsed/tasks_2026-01-18.json');
});
```

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCdpEndpoint } from '../src/config/cdp.js';

test('getCdpEndpoint uses default port when not set', () => {
  const endpoint = getCdpEndpoint({});
  assert.equal(endpoint, 'http://127.0.0.1:9222');
});
```

**Step 2: Run tests to verify they fail**

Run: `node --test tests/paths.test.js tests/cdp.test.js`
Expected: FAIL with module not found or function not defined.

**Step 3: Write minimal implementations**

```js
import path from 'node:path';

export function getOutputPaths(dateString) {
  return {
    rawCsv: path.posix.join('data', 'raw', `tasks_${dateString}.csv`),
    parsedJson: path.posix.join('data', 'parsed', `tasks_${dateString}.json`),
  };
}
```

```js
export function getCdpEndpoint(env) {
  if (env.CDP_ENDPOINT && env.CDP_ENDPOINT.trim()) {
    return env.CDP_ENDPOINT.trim();
  }
  if (env.CDP_PORT && String(env.CDP_PORT).trim()) {
    return `http://127.0.0.1:${String(env.CDP_PORT).trim()}`;
  }
  return 'http://127.0.0.1:9222';
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test tests/paths.test.js tests/cdp.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json .env.example src/config/paths.js src/config/selectors.js src/config/runtime.js src/config/cdp.js prompts/grok_tasks_prompt.txt tests/paths.test.js tests/cdp.test.js
git commit -m "feat: add project scaffold and path config"
```

### Task 2: CSV writer and reader

**Files:**
- Create: `src/io/csv.js`
- Test: `tests/csv.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv, fromCsv } from '../src/io/csv.js';

const sample = [
  {
    username: 'alice',
    tweet_id: '1',
    created_at: '2026-01-18T00:00:00Z',
    text: 'hello, world',
    original_url: 'https://x.com/a/status/1'
  }
];

test('toCsv and fromCsv round-trip', () => {
  const csv = toCsv(sample);
  const parsed = fromCsv(csv);
  assert.deepEqual(parsed, sample);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/csv.test.js`
Expected: FAIL with module not found or function not defined.

**Step 3: Write minimal implementation**

```js
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

const HEADERS = ['username', 'tweet_id', 'created_at', 'text', 'original_url'];

export function toCsv(rows) {
  return stringify(rows, { header: true, columns: HEADERS });
}

export function fromCsv(content) {
  return parse(content, { columns: true, skip_empty_lines: true });
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/csv.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/io/csv.js tests/csv.test.js
git commit -m "feat: add CSV IO helpers"
```

### Task 3: Normalization helpers

**Files:**
- Create: `src/normalize/task.js`
- Test: `tests/normalize.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTask } from '../src/normalize/task.js';

test('normalizeTask trims fields and enforces utc string', () => {
  const input = {
    username: '  bob ',
    tweet_id: ' 42 ',
    created_at: '2026-01-18T00:00:00.000Z',
    text: ' hello ',
    original_url: ' https://x.com/b/status/42 '
  };
  const out = normalizeTask(input);
  assert.equal(out.username, 'bob');
  assert.equal(out.tweet_id, '42');
  assert.equal(out.created_at, '2026-01-18T00:00:00Z');
  assert.equal(out.text, 'hello');
  assert.equal(out.original_url, 'https://x.com/b/status/42');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/normalize.test.js`
Expected: FAIL with module not found or function not defined.

**Step 3: Write minimal implementation**

```js
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
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/normalize.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/normalize/task.js tests/normalize.test.js
git commit -m "feat: add task normalization"
```

### Task 4: Prompt builder and JSON validation

**Files:**
- Create: `src/ai/prompt.js`
- Create: `src/ai/json.js`
- Test: `tests/prompt.test.js`
- Test: `tests/json.test.js`

**Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptInput } from '../src/ai/prompt.js';

const rows = [
  { username: 'a', tweet_id: '1', created_at: '2026-01-18T00:00:00Z', text: 't', original_url: 'u' }
];

test('buildPromptInput injects ID markers', () => {
  const out = buildPromptInput(rows);
  assert.ok(out.includes('[ID: 1]'));
});
```

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonStrict } from '../src/ai/json.js';

test('parseJsonStrict returns object on valid json', () => {
  const obj = parseJsonStrict('{"a":1}');
  assert.equal(obj.a, 1);
});
```

**Step 2: Run tests to verify they fail**

Run: `node --test tests/prompt.test.js tests/json.test.js`
Expected: FAIL with module not found or function not defined.

**Step 3: Write minimal implementation**

```js
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
```

```js
export function parseJsonStrict(text) {
  return JSON.parse(text);
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test tests/prompt.test.js tests/json.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ai/prompt.js src/ai/json.js tests/prompt.test.js tests/json.test.js
git commit -m "feat: add prompt builder and json parser"
```

### Task 5: OpenAI client wrapper

**Files:**
- Create: `src/ai/client.js`
- Create: `src/ai/parse.js`
- Test: `tests/ai-parse.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { withJsonRetry } from '../src/ai/parse.js';

const good = async () => '{"ok":true}';

test('withJsonRetry returns parsed json', async () => {
  const out = await withJsonRetry(good, 1);
  assert.equal(out.ok, true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/ai-parse.test.js`
Expected: FAIL with module not found or function not defined.

**Step 3: Write minimal implementation**

```js
import { parseJsonStrict } from './json.js';

export async function withJsonRetry(fetchFn, retries) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const text = await fetchFn();
      return parseJsonStrict(text);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/ai-parse.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ai/parse.js tests/ai-parse.test.js
git commit -m "feat: add ai parse retry"
```

### Task 6: CDP connection and scraper core

**Files:**
- Create: `src/scrape/cdp.js`
- Create: `src/scrape/tasks.js`
- Test: `tests/scrape-selectors.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { requiredSelectors } from '../src/config/selectors.js';

test('required selectors are defined', () => {
  for (const key of requiredSelectors) {
    assert.ok(key);
  }
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/scrape-selectors.test.js`
Expected: FAIL if config missing.

**Step 3: Write minimal implementation**

```js
export const selectors = {
  taskCard: '[data-testid="task"]',
  username: '[data-testid="username"]',
  timestamp: '[data-testid="time"]',
  text: '[data-testid="content"]',
  originalLink: 'a[data-testid="original"]'
};

export const requiredSelectors = Object.values(selectors);
```

```js
import { chromium } from 'playwright';
import { getCdpEndpoint } from '../config/cdp.js';

export async function connectCdp(env) {
  const endpoint = getCdpEndpoint(env);
  return chromium.connectOverCDP(endpoint);
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/scrape-selectors.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/config/selectors.js src/scrape/cdp.js tests/scrape-selectors.test.js
git commit -m "feat: add selector config and cdp connector"
```

### Task 7: CLI entry and pipeline wiring

**Files:**
- Create: `scripts/run-tasks.js`
- Create: `src/pipeline/run.js`
- Create: `src/io/files.js`
- Test: `tests/pipeline.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPipelineInput } from '../src/pipeline/run.js';

test('buildPipelineInput assembles prompt input', () => {
  const out = buildPipelineInput([{ tweet_id: '1', username: 'a', created_at: 't', text: 'x', original_url: 'u' }]);
  assert.ok(out.includes('[ID: 1]'));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/pipeline.test.js`
Expected: FAIL with module not found or function not defined.

**Step 3: Write minimal implementation**

```js
import { buildPromptInput } from '../ai/prompt.js';

export function buildPipelineInput(rows) {
  return buildPromptInput(rows);
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/pipeline.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pipeline/run.js tests/pipeline.test.js
git commit -m "feat: add pipeline input builder"
```

### Task 8: End-to-end integration (no UI automation in tests)

**Files:**
- Modify: `scripts/run-tasks.js`
- Modify: `src/pipeline/run.js`

**Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { planOutputFiles } from '../src/pipeline/run.js';

test('planOutputFiles returns raw and parsed paths', () => {
  const out = planOutputFiles('2026-01-18');
  assert.equal(out.rawCsv, 'data/raw/tasks_2026-01-18.csv');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/pipeline-outputs.test.js`
Expected: FAIL with function not defined.

**Step 3: Write minimal implementation**

```js
import { getOutputPaths } from '../config/paths.js';

export function planOutputFiles(dateString) {
  return getOutputPaths(dateString);
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/pipeline-outputs.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pipeline/run.js tests/pipeline-outputs.test.js
git commit -m "feat: add pipeline output planner"
```

### Task 9: Documentation

**Files:**
- Create: `README.md`

**Step 1: Write the failing test**

No automated tests. Ensure README documents setup, environment variables, and CLI usage.
Include how to start Chrome with CDP, e.g. `google-chrome --remote-debugging-port=9222 --user-data-dir=./chrome-profile`.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add usage and setup"
```
