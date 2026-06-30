# Phase 5 前准备状态

本文档用于确认仓库是否已经具备进入 Phase 5：Tauri 桌面端封装的准备状态。它不是 Tauri 实施方案，也不要求当前立即创建 Tauri 工程。

## 当前结论

当前仓库已达到进入 Phase 5 前的 prepared 状态，并且已进一步完成最小 Tauri 壳接入。后续正式运行或打包桌面端前，仍应先确认静态 Web fallback 和验证命令都通过。

## 已具备条件

- Phase 0 行为保护已具备：文档体系、人工 smoke checklist、规则 smoke、样例 JSON、git 基线齐全。
- Phase 1 模块边界已收敛：核心规则位于 `src/core/rules`，状态规范化位于 `src/app/storage`。
- Phase 2 核心规则拆分已完成：`planner.js` 主要承担兼容导出。
- Phase 3 数据底座已完成第一版：`WorkoutSession`、`ExerciseLog.sessionId`、可选 `SetLog`、基础训练容量统计、`schemaVersion: 2` 和导入规范化已具备。
- Phase 4 TypeScript core 最小迁移已完成：核心规则和状态规范化已有 `.ts` 源文件，模型声明位于 `src/core/models/index.d.ts`。
- `index.html` 仍可直接双击运行，浏览器入口继续加载 `.js`。
- `docs/sample-data/manual-smoke-baseline.json` 仍作为人工验收样例数据。
- `phase4-baseline` 已作为 Phase 4 可回退 git 标签。
- `src-tauri/` 已作为 Phase 5 最小桌面壳落地。
- `npm.cmd run verify:desktop` 已作为进入 Tauri dev/build 前的仓库检查命令。

## 进入 Phase 5 前必须通过的命令

在 Windows PowerShell 中运行：

```text
npm.cmd run verify:phase5
npm.cmd run verify:desktop
```

`verify:phase5` 会依次执行：

1. `npm run check:core`：TypeScript core 类型检查。
2. `npm run build:core`：生成 `.js` 兼容输出。
3. `npm run check:js`：检查当前浏览器会加载的 JS 文件语法。
4. `npm run smoke:rules`：在 Node 中等价执行 `tests/rules-smoke.html` 的 12 个规则用例。

`verify:desktop` 会在上述检查后执行 `prepare:desktop`，生成 Tauri 使用的 `dist/desktop` 前端资源。

## 仍需人工确认

- 双击 `index.html` 后应用可打开。
- 可导入 `docs/sample-data/manual-smoke-baseline.json`。
- 重点页面按 `docs/SMOKE_CHECKLIST.md` 跑通。
- JSON 导入 / 导出仍可用。
- CSV 训练计划导入 / 导出仍可用。

## Phase 5 可以做什么

- 新建 Tauri 壳。
- 先加载现有静态前端页面。
- 保留 localStorage / JSON 作为初期数据路径。
- 增加桌面端文件读取 / 保存能力时，必须保持 JSON 备份路径。
- 保留静态 Web 版本作为 fallback。

## Phase 5 暂不做什么

- 不在刚进入 Phase 5 时迁移 SQLite。
- 不重写 UI。
- 不引入 React / Vue。
- 不做账号系统、云同步或多端同步。
- 不让 AI 或规则静默修改训练计划。
- 不删除现有 JSON 导入导出路径。

## 已知技术债

- 规则 `.ts` 文件仍保留过渡性的 `// @ts-nocheck`。这是 Phase 4 为保持行为不变而接受的技术债。
- 后续应优先从 `metric-analyzer`、`training-stats`、`goal-parser` 这类小模块开始移除 `// @ts-nocheck` 并收紧类型。
- `app.js` 仍是大型 UI / 状态协调文件，Phase 5 不应借桌面封装顺手重写它。
