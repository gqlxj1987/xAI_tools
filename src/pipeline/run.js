import fs from 'node:fs/promises';
import { buildPromptInput, buildPromptPayload } from '../ai/prompt.js';
import { getOutputPaths } from '../config/paths.js';
import { getRuntimeConfig } from '../config/runtime.js';
import { createOpenAIClient } from '../ai/client.js';
import { withOutputRetry } from '../ai/parse.js';
import { getChatCompletionOutput } from '../ai/output.js';
import { readFileIfExists, writeFile } from '../io/files.js';
import { fromCsv, toCsv } from '../io/csv.js';
import { parseCsvFromMessage } from '../parse/task-csv.js';
import { connectCdp } from '../scrape/cdp.js';
import { fetchConversationResponses, fetchLatestTaskResult, fetchTasks } from '../scrape/grok.js';
import { getDateKey } from '../scrape/tasks.js';

export function buildPipelineInput(rows) {
  return buildPromptInput(rows);
}

export function planOutputFiles(dateString) {
  return getOutputPaths(dateString);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args.set(key, next);
        i += 1;
      } else {
        args.set(key, 'true');
      }
    }
  }
  return args;
}

function parseBool(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return false;
  }
  return value === 'true';
}

export async function runPipeline(env, argv) {
  const args = parseArgs(argv || process.argv);
  const skipScrape = parseBool(args.get('skip-scrape'));
  const skipParse = parseBool(args.get('skip-parse'));
  const dateArg = args.get('date');
  const now = new Date();
  const dateKey = dateArg || formatDateKey(now);
  const runtime = getRuntimeConfig(env);
  const { rawCsv, summaryMd } = planOutputFiles(dateKey);

  let rows = [];
  if (!skipScrape) {
    let browser;
    let context;
    let page;
    let ownsContext = false;
    try {
      browser = await connectCdp(env);
      context = browser.contexts()[0];
      if (!context) {
        context = await browser.newContext();
        ownsContext = true;
      }
      page = await context.newPage();
      await page.goto('https://grok.com/tasks', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const tasksData = await fetchTasks(page);
      const taskItems = tasksData.tasks || [];
      const latestResults = [];
      for (const item of taskItems) {
        const taskId = item.task?.taskId;
        if (!taskId) {
          continue;
        }
        const resultData = await fetchLatestTaskResult(page, taskId);
        const result = resultData.results?.[0];
        if (result) {
          latestResults.push(result);
        }
      }

      const resultsToday = latestResults.filter((result) => {
        if (!result.createTime) {
          return false;
        }
        return getDateKey(result.createTime, runtime.timeZone) === dateKey;
      });

      const allRows = [];
      for (const result of resultsToday) {
        const convoId = result.conversationId;
        if (!convoId) {
          continue;
        }
        await page.goto(`https://grok.com/c/${convoId}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        const responsesData = await fetchConversationResponses(page, convoId);
        const responses = responsesData.responses || [];
        const assistant = responses.find((res) => res.sender === 'assistant');
        const parsed = parseCsvFromMessage(assistant?.message || '');
        allRows.push(...parsed);
      }

      const unique = new Map();
      for (const row of allRows) {
        if (!row.tweet_id) {
          continue;
        }
        unique.set(row.tweet_id, row);
      }
      rows = Array.from(unique.values());
      const csv = toCsv(rows);
      await writeFile(rawCsv, csv);
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (err) {
          console.warn('Failed to close page', err);
        }
      }
      if (context && ownsContext) {
        try {
          await context.close();
        } catch (err) {
          console.warn('Failed to close context', err);
        }
      }
      if (browser) {
        try {
          await browser.disconnect();
        } catch (err) {
          console.warn('Failed to disconnect browser', err);
        }
      }
    }
  } else {
    const content = await readFileIfExists(rawCsv);
    if (!content) {
      throw new Error(`CSV not found at ${rawCsv}`);
    }
    rows = fromCsv(content);
  }

  if (!skipParse) {
    const promptTemplate = await fs.readFile(runtime.promptPath, 'utf-8');
    const input = buildPipelineInput(rows);
    const client = createOpenAIClient(env);
    const payload = buildPromptPayload(promptTemplate, input);
    const response = await withOutputRetry(() => getChatCompletionOutput(client, runtime.model, payload), 1);
    await writeFile(summaryMd, response);
  }

  return { rawCsv, summaryMd, count: rows.length };
}
