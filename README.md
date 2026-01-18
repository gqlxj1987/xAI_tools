# Grok Tasks Pipeline

## 概述
本项目通过 Chrome DevTools Protocol (CDP) 抓取 `https://grok.com/tasks` 的每日任务，导出原始 CSV，再调用兼容 OpenAI 的 Chat Completions API 生成编辑级 Markdown 摘要。

## 依赖
- Node.js 18+
- 启用 CDP 的 Google Chrome（或 Chromium）

## 安装
1. 安装依赖：

```bash
npm install
```

2. 从示例创建 `.env` 并补充配置：

```bash
cp .env.example .env
```

必填变量：
- `GROK_USERNAME`
- `GROK_PASSWORD`
- `OPENAI_API_KEY`

可选变量：
- `OPENAI_MODEL`（默认：`mimo-v2-flash`）
- `OPENAI_BASE_URL`（默认：`https://api.openai.com/v1`，若缺少 `/v1` 会自动追加）
- `PROMPT_PATH`（默认：`prompts/grok_tasks_prompt.txt`）
- `CDP_PORT`（默认：`9222`）
- `TASKS_TIMEZONE`（默认：系统本地时区）

## 启动 Chrome（CDP）
在运行脚本前手动启动 Chrome：

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=./chrome-profile
```

确保该 Chrome 实例可以访问 `https://grok.com/tasks`。脚本会连接到第一个可用的 tab/context，并在需要时进行导航。
如使用系统代理，脚本会自动将 localhost 追加到 `NO_PROXY`，避免 CDP 400 错误。

## 运行
抓取当日任务并解析：

```bash
npm run run:tasks
```

每日快捷运行（自动使用本地日期）：

```bash
npm run run:today
```

仅抓取（跳过解析）：

```bash
npm run run:tasks -- --skip-parse
```

仅解析（使用已有 CSV）：

```bash
npm run run:tasks -- --skip-scrape
```

指定日期（本地时区）：

```bash
npm run run:tasks -- --date 2026-01-18
```

## 输出
- 原始 CSV：`data/raw/tasks_YYYY-MM-DD.csv`
- Markdown 摘要：`data/parsed/tasks_YYYY-MM-DD.md`

## 备注
- 脚本启动前必须保证 CDP 正常可用。
- 若 CDP 不可用，脚本会直接失败并退出。
