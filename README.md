# Grok Tasks Pipeline

## Overview
This project scrapes daily tasks from `https://grok.com/tasks` via Chrome DevTools Protocol (CDP), exports raw CSV, and then uses OpenAI to produce a structured JSON editorial summary.

## Requirements
- Node.js 18+
- Google Chrome (or Chromium) with CDP enabled

## Setup
1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example and fill in credentials:

```bash
cp .env.example .env
```

Required variables:
- `GROK_USERNAME`
- `GROK_PASSWORD`
- `OPENAI_API_KEY`

Optional variables:
- `OPENAI_MODEL` (default: `mimo-v2-flash`)
- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `PROMPT_PATH` (default: `prompts/grok_tasks_prompt.txt`)
- `CDP_PORT` (default: `9222`)
- `TASKS_TIMEZONE` (default: local system timezone)

## Start Chrome with CDP
Start Chrome manually before running the script:

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=./chrome-profile
```

Ensure you can visit `https://grok.com/tasks` in that Chrome instance. The script will connect to the first available tab/context and navigate if needed.
If you use system proxies, the script will auto-append localhost to `NO_PROXY` to avoid CDP 400 errors.

## Run
Fetch today’s tasks and parse:

```bash
npm run run:tasks
```

Run only scraping (skip OpenAI parse):

```bash
npm run run:tasks -- --skip-parse
```

Run only parsing (use existing CSV):

```bash
npm run run:tasks -- --skip-scrape
```

Specify a date key (local timezone):

```bash
npm run run:tasks -- --date 2026-01-18
```

## Outputs
- Raw CSV: `data/raw/tasks_YYYY-MM-DD.csv`
- Parsed JSON: `data/parsed/tasks_YYYY-MM-DD.json`

## Notes
- CDP must be running before the script starts.
- If CDP is unavailable, the script will fail immediately.
