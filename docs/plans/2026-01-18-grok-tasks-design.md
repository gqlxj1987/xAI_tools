# grok.com/tasks 日常采集与编辑解析设计

## 背景
需要模拟人工浏览 grok.com/tasks，抓取“今日”任务列表并导出原始 CSV，然后调用 OpenAI 完成编辑级别的深度整理，最终产出 Markdown 摘要。

## 目标
- 基于 Playwright UI 自动化获取当日 tasks。
- 输出原始 CSV：`data/raw/tasks_YYYY-MM-DD.csv`。
- 使用 OpenAI 模型 `mimo-v2-flash` + 指定 prompt，输出解析后 Markdown：`data/parsed/tasks_YYYY-MM-DD.md`。
- 具备可追溯性（每条输出能映射回 tweet_id）。

## 非目标
- 不做复杂的 UI 视觉回放或多账号调度。
- 不做自动化内容发布。

## 关键约束与假设
- 使用 Node.js + Playwright。
- 登录为账号密码模式，无 2FA。
- CSV 字段固定为：`username,tweet_id,created_at,text,original_url`，时间为 UTC。
- 解析输出遵循已确认的编辑稿格式（Deep Brief / Editor's Choice / High Value List / Summary），以 Markdown 形式呈现。
- 账号与 OpenAI Key 通过 `.env` 提供。

## 总体架构
流水线分为两个阶段：
1) **抓取阶段**：Playwright 通过 CDP 连接浏览器，进入 `/tasks` 页面后使用页面内 `fetch` 调用任务相关接口，汇总当日内容并写入 CSV。
2) **解析阶段**：将 CSV 转为模型输入文本（按顺序拼接，插入 `[ID: tweet_id]`），调用 OpenAI 输出 Markdown，落盘保存。

## 模块拆分
- **Auth**：登录流程封装、保存登录态（storageState）。
- **TasksScraper**：页面加载与基于页面上下文的接口抓取。
- **Normalizer**：字段清洗与格式化（UTC 时间、文本保真、URL 标准化）。
- **CSVWriter**：表头固定、去重写入、断点续跑。
- **OpenAIParser**：构建 prompt + 输入，调用模型并输出 Markdown。

## 数据流与可追溯性
- 每条 task 写入 CSV 保留 `tweet_id` 作为主键。
- 解析输入拼接时保留 `[ID: tweet_id]` 标记，确保结果可反向定位。

## 输出结构（Markdown 纲要）
- 今日要点摘要（Deep Brief）
- 编辑精选（Editor's Choice）
  - 硬核工具
  - 深度洞察
  - 重大动态
  - 优质资源
- 高价值推文完整清单（表格）
- 总结（处理条数与筛选条数）

## 错误处理与重试
- **可恢复错误**：页面加载慢、滚动无新增、短暂网络失败、OpenAI 限速。处理方式为重试与指数退避。
- **不可恢复错误**：登录失败、关键 DOM 选择器缺失、输出目录不可写。直接退出并提示修复建议。

## 运行方式
提供 CLI 入口：
- 默认执行“抓取 + 解析”。
- 可选参数：`--date`（默认今日）、`--skip-scrape`、`--skip-parse`。

## 测试策略
- 为字段标准化与 CSV 写入提供单元测试。
- 解析阶段支持“离线模式”使用固定样例输出以验证 Markdown 结构。

## 风险与缓解
- **UI 结构变化**：将选择器集中配置，并提供快速调试开关（截图/HTML dump）。
- **接口字段变化**：集中封装接口访问与字段解析，异常时保留原始文本便于排查。
- **模型输出空文本**：进行一次重试，仍失败则落原始文本供排查。

## 下一步
- 若确认进入实现阶段，创建工作区并按实现计划落地。
