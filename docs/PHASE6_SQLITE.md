# Phase 6：SQLite 本地数据库迁移

本文档记录 Phase 6 的当前实现状态。Phase 6 的目标是让 Tauri 桌面端具备 SQLite 本地数据库持久化，同时继续保留 JSON 备份 / 恢复路径。

## 当前实现

- Tauri 桌面端新增 SQLite 命令：
  - `load_app_state`
  - `save_app_state`
- 浏览器端新增 `src/app/storage/desktop-sqlite.js` / `.ts`：
  - 在 Tauri 环境中通过 `window.__TAURI__.core.invoke` 读写 SQLite。
  - 仅在 Tauri 桌面环境中启用。
- `src/app/storage/app-state-store.js` / `.ts` 负责默认状态、localStorage 读写，以及 Tauri SQLite 的 hydrate / persist 协调。
- `app.js` 的状态保存路径变为：
  - 始终写入 localStorage。
  - 如果检测到 Tauri，则异步同步到 SQLite。
- 应用启动时：
  - 先同步读取 localStorage，保证旧本地状态可以被迁入桌面环境。
  - 如果在 Tauri 环境中，再异步读取 SQLite 状态并刷新页面。

## SQLite 表

当前 SQLite 采用“完整状态快照 + 结构化镜像表”的保守方案。

完整快照：

- `app_meta`

结构化镜像表：

- `goals`
- `gyms`
- `exercises`
- `training_plans`
- `workout_days`
- `planned_exercises`
- `workout_sessions`
- `exercise_logs`
- `set_logs`
- `body_metrics`
- `nutrition_logs`
- `advice`
- `revisions`

其中 `app_meta.app_state` 保存完整 JSON，用于无损恢复；结构化表用于后续查询、统计和逐步迁移。这个方案避免 Phase 6 一次性把所有读取逻辑改成 SQL 查询，降低功能回退风险。

## 保留路径

- JSON 仍是备份 / 导入导出格式。
- JSON 仍是备份 / 恢复 fallback。
- 根目录 `index.html` 双击入口已移除；`src/app/index.html` 仅作为桌面前端源文件。
- CSV 训练计划导入 / 导出不变。

## 当前限制

- `npm.cmd run desktop:build:app` 已可编译出桌面 exe，说明 Tauri + SQLite Rust 侧链路可用。
- `npm.cmd run desktop:build` 会继续生成安装包，首次可能下载 WiX；这属于安装包工具链，不影响应用 exe 编译验证。
- `cargo test --manifest-path src-tauri/Cargo.toml` 已覆盖 SQLite 内存库保存、读取完整快照和镜像核心业务表的最小用例。

## 验证命令

```text
npm.cmd run verify:desktop
cargo test --manifest-path src-tauri/Cargo.toml
npm.cmd run desktop:build:app
npm.cmd run desktop:build
```

`verify:desktop` 可验证 TypeScript core、JS 语法、规则 smoke 和桌面前端资源。`cargo test` 用于验证 SQLite 保存 / 读取和镜像表写入。`desktop:build:app` 用于验证 Tauri + SQLite Rust 侧可编译出 exe。`desktop:build` 用于继续生成安装包，首次可能下载 WiX。

## 已完成的清理

- SQLite Rust 侧保存 / 读取逻辑已抽出为可单测的 connection helper，不再只能通过 Tauri `AppHandle` 手工验证。
- `createAdviceFromSession` 已从 `planner.js` 并入 `src/core/rules/advice-engine.js`。
- 新增 `src/core/rules/facade.js` / `.ts` 作为 `window.FitnessCore.Rules`，`app.js` 已改为使用该 core facade。
- `planner.js` 仅保留 `window.FitnessPlanner` 旧入口兼容别名。

## 后续清理条件

以下条件全部满足后，才能继续移除兼容层：

- `desktop:dev`、`desktop:build:app` 和 `desktop:build` 均可运行。
- SQLite 读写自动 smoke 与人工 smoke checklist 都通过。
- SQLite 读写经过人工 smoke checklist。
- JSON 导入旧数据后能同步进入 SQLite。
- Tauri 桌面端仍可打开并读写 SQLite / JSON 备份路径。
- 有从 SQLite 导出 JSON 的确认路径。
