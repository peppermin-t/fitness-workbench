# 决策记录

本文档只保留长期仍然有效的产品和架构决策。阶段性执行细节不再单独记录。

## 1. 本软件是个人定制训练工作台

本软件 primarily 服务单个用户的长期训练决策，不以泛用商业健身 SaaS 为目标。

当前核心场景是力量训练、出差训练、饮食记录、身体指标、动作反馈和计划调整。长期可以考虑徒步、越野跑、滑雪季维护和攀岩基础训练，但这些只属于个人画像和目标模板扩展方向，不进入当前核心范围。

## 2. 当前运行形态是 Tauri 桌面端

旧的根目录 `index.html` 双击入口已经移除。当前入口是 Tauri 桌面端：

- `src/app/index.html` 是前端源文件。
- `src/**/*.ts` 是源代码。
- `dist/generated` 是 TS 编译输出。
- `dist/desktop` 是 Tauri 加载的前端资源。

根目录和 `src` 下不再提交 `.js` 源码。浏览器和 Tauri WebView 仍然运行 JS，因此 `dist/generated` 和 `dist/desktop` 中存在 JS 是正常构建产物，不是源代码双份维护。

## 3. 长期技术路线是 ES Modules + Vite + strict TypeScript + Tauri + SQLite

项目不是临时停留在纯 HTML / JS，也不能长期停留在 `module: none`、全局命名空间和手动 script 顺序加载。长期技术路线已经明确：

1. 标准 ES Modules，业务模块通过 `import/export` 连接。
2. Vite bundler，替代手动 script 顺序管理。
3. strict TypeScript，逐步开启 `noImplicitAny`、`strictNullChecks`、`noUncheckedIndexedAccess` 和最终 `strict`。
4. Tauri 桌面端。
5. SQLite 本地数据库。

当前的 `window.FitnessCore/FitnessApp` 只能作为迁移兼容层。迁移顺序不能反过来：必须先稳定模型、规则、迁移和测试，再扩大存储、UI 框架和平台能力。

## 4. UI 写操作必须走 Application Command

UI 不应直接修改业务状态。所有写操作必须通过 application command / use case：

- command 接收 typed DTO；
- command 做 schema validation；
- command 读取 repository；
- command 调用 domain rules；
- command 在 SQLite transaction 内写入；
- command 返回 typed result；
- UI 通过 query refresh 获取新的 read model。

读操作必须通过 query/read model。今日页、计划页、动作历史、周复盘、饮食画像和建议收件箱都应拥有自己的 query DTO，而不是直接读取完整 `AppState`。

## 5. Domain 层必须纯净

Domain 层不能访问 DOM、`window`、Tauri、SQLite、`localStorage`、toast、下载 API 或文件 input。Domain 只接收普通对象，返回普通对象，并能在 Node 测试环境直接运行。

Domain model 必须维护核心 invariants，尤其是 `WorkoutSession`、`ExerciseLog`、`SetLog`、`Advice`、`Revision` 和训练计划 patch 的合法性。任何计划修改都必须通过 revision，而不是由规则静默写入计划。

## 6. SQLite 是目标 source of truth，JSON 仍是安全网

SQLite 当前只是桌面运行时本地存储桥接，长期目标是成为业务 source of truth。JSON 必须继续作为备份、恢复和迁移格式保留。

任何 SQLite schema 或状态迁移失败都不应导致用户数据不可恢复。

## 7. 今日训练是 Session Lifecycle

今日训练不是普通表单提交。它必须建模为：

```text
start session -> log sets -> quick feedback -> finish session -> generate advice/revision
```

训练执行 UI 的核心验收是低录入成本：用户应能在 5-10 秒内记录一组，并在今日页内完成整次训练记录。

## 8. React / Vite 不能作为无保护大重写

最终 UI 方向是 Vite + React + TypeScript，但不要第一步全量重写。

只有当今日训练卡片化、局部状态、快速记录、复杂条件渲染和局部刷新明显压垮无框架 DOM，并且 application/query 层已经能提供稳定 DTO 时，才进入 React UI 重构。迁移顺序优先是 `TodayPage`，不是一次性重写所有页面。

## 9. AI 不能静默修改训练计划

AI 或规则只能生成候选建议。修改训练计划必须经过：

- schema 校验；
- 规则引擎处理；
- 用户显式确认；
- revision 记录。

这个约束在后续 AI 结构化解析阶段仍然成立。

## 10. 文档不再按阶段膨胀

重构阶段文档已经收口。后续只维护：

- `PRODUCT_VISION.md`
- `ARCHITECTURE.md`
- `TESTING.md`
- `DECISIONS.md`

除非有长期价值，不再新增一次性 Phase 文档。

## 11. 当前质量提升方向

已完成：

- `globals.d.ts` 已移除 `Function` 型全局边界，改为 `UnknownFn`，调用处按模块补类型桥接。
- `src/app/main.ts` 已抽出 DOM 查询和 toast 控制到 `src/app/ui/dom-utils.ts`。
- SQLite 已新增基于真实样例 JSON 的后端状态镜像 smoke。

后续仍可继续：

- 修复 CSV parser 并补 roundtrip 测试。
- 对齐 `GoalPrimary` 类型与 `parseGoal` 实现。
- 做 core rules ES module POC，并保留旧 facade 兼容。
- 建立 `GeneratePlan` 和 `SaveExerciseLog` use case。
- 导入 JSON 和恢复初始数据前自动备份。
- 将高频全局模块从 `UnknownFn` 进一步收紧为精确函数签名。
- 将 `src/app/main.ts` 的事件绑定和表单读取继续拆到更小的 UI 协调模块。
- 在 Tauri command 层补更完整的端到端存储测试。
