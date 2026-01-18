import fs from 'node:fs/promises';
import { buildPromptInput } from '../ai/prompt.js';
import { getOutputPaths } from '../config/paths.js';
import { getRuntimeConfig } from '../config/runtime.js';
import { createOpenAIClient } from '../ai/client.js';
import { withJsonRetry } from '../ai/parse.js';
import { readFileIfExists, writeFile } from '../io/files.js';
import { fromCsv, toCsv } from '../io/csv.js';
import { normalizeTask } from '../normalize/task.js';
import { connectCdp } from '../scrape/cdp.js';
import { collectTasksFromPage, filterTasksByLocalDate } from '../scrape/tasks.js';

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
  const { rawCsv, parsedJson } = planOutputFiles(dateKey);

  let rows = [];
  if (!skipScrape) {
    const browser = await connectCdp(env);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    const tasks = await collectTasksFromPage(page, {
      maxScrolls: 40,
      scrollDelayMs: 800
    });
    const normalized = tasks.map((task) => normalizeTask(task));
    rows = filterTasksByLocalDate(normalized, dateKey, runtime.timeZone);
    const csv = toCsv(rows);
    await writeFile(rawCsv, csv);
    await browser.close();
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
    const payload = `${promptTemplate}\n\n${input}`;
    const response = await withJsonRetry(async () => {
      const result = await client.responses.create({
        model: runtime.model,
        input: payload
      });
      return result.output_text;
    }, 1);
    await writeFile(parsedJson, JSON.stringify(response, null, 2));
  }

  return { rawCsv, parsedJson, count: rows.length };
}
