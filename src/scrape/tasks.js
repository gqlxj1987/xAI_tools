import fs from 'node:fs/promises';
import { selectors } from '../config/selectors.js';

const DEFAULT_TASKS_URL = 'https://grok.com/tasks';

export function getDateKey(isoString, timeZone) {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function filterTasksByLocalDate(rows, dateString, timeZone) {
  return rows.filter((row) => getDateKey(row.created_at, timeZone) === dateString);
}

export function normalizeText(text) {
  if (!text) {
    return '';
  }
  return text.replace(/\s+$/g, '');
}

export function parseTweetIdFromUrl(url) {
  if (!url) {
    return null;
  }
  const match = url.match(/status\/(\d+)/i);
  return match ? match[1] : null;
}

export function parseTaskCard(card) {
  const username = card.querySelector(selectors.username)?.textContent?.trim() || '';
  const text = normalizeText(card.querySelector(selectors.text)?.textContent || '');
  const timestamp = card.querySelector(selectors.timestamp)?.getAttribute('datetime')
    || card.querySelector(selectors.timestamp)?.textContent
    || '';
  const originalUrl = card.querySelector(selectors.originalLink)?.href || '';
  const tweetId = parseTweetIdFromUrl(originalUrl) || card.getAttribute('data-id') || '';
  return {
    username,
    tweet_id: tweetId,
    created_at: timestamp,
    text,
    original_url: originalUrl
  };
}

export async function collectTasksFromPage(page, options) {
  const tasksUrl = options?.tasksUrl || DEFAULT_TASKS_URL;
  const maxScrolls = options?.maxScrolls ?? 40;
  const scrollDelayMs = options?.scrollDelayMs ?? 800;
  await page.goto(tasksUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  let lastCount = 0;
  let stagnant = 0;
  for (let i = 0; i < maxScrolls; i += 1) {
    const count = await page.evaluate((selector) => {
      return document.querySelectorAll(selector).length;
    }, selectors.taskCard);
    if (count === lastCount) {
      stagnant += 1;
      if (stagnant >= 3) {
        break;
      }
    } else {
      stagnant = 0;
    }
    lastCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(scrollDelayMs);
  }

  const tasks = await page.evaluate((config) => {
    const cards = Array.from(document.querySelectorAll(config.taskCard));
    return cards.map((card) => {
      const username = card.querySelector(config.username)?.textContent?.trim() || '';
      const text = card.querySelector(config.text)?.textContent || '';
      const timestamp = card.querySelector(config.timestamp)?.getAttribute('datetime')
        || card.querySelector(config.timestamp)?.textContent
        || '';
      const originalUrl = card.querySelector(config.originalLink)?.href || '';
      const match = originalUrl.match(/status\/(\d+)/i);
      const tweetId = match ? match[1] : (card.getAttribute('data-id') || '');
      return {
        username,
        tweet_id: tweetId,
        created_at: timestamp,
        text: text.replace(/\s+$/g, ''),
        original_url: originalUrl
      };
    });
  }, selectors);

  return tasks;
}

export async function dumpHtml(page, filePath) {
  const html = await page.content();
  await fs.writeFile(filePath, html, 'utf-8');
}
