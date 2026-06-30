# Phase 6：SQLite 本地数据库迁移

本文档记录 Phase 6 的当前实现状态。Phase 6 的目标是让 Tauri 桌面端具备 SQLite 本地数据库持久化，同时继续保留 `index.html` 静态 Web fallback 和 JSON 备份 / 恢复路径。

## 当前实现

- Tauri 桌面端新增 SQLite 命令：
  - `load_app_state`
  - `save_app_state`
- 浏览器端新增 `src/app/storage/desktop-sqlite.js` / `.ts`：
  - 在 Tauri 环境中通过 `window.__TAURI__.core.invoke` 读写 SQLite。
  - 在普通浏览器 / 双击 `index.html` 时自动不可用，不影响 localStorage。
- `app.js` 的状态保存路径变为：
  - 始终写入 localStorage。
  - 如果检测到 Tauri，则异步同步到 SQLite。
- 应用启动时：
  - 先同步读取 localStorage，保证静态 Web 继续可用。
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
- localStorage 仍是静态 Web fallback。
- `index.html` 双击运行不依赖 SQLite。
- CSV 训练计划导入 / 导出不变。

## 当前限制

- 当前仓库已写入 Rust / Tauri / SQLite 代码，但本机 `desktop:build` 仍需要成功访问 crates.io 下载 Rust 依赖。
- 由于当前执行环境访问 crates.io 出现 SSL credential 错误，Phase 6 的 JS 保护层和前端资源准备已验证，Rust 编译需要在本机网络 / 证书环境恢复后执行。

## 验证命令

```text
npm.cmd run verify:desktop
npm.cmd run desktop:build
```

`verify:desktop` 不依赖 Rust crates，可验证 TypeScript core、JS 语法、规则 smoke 和桌面前端资源。`desktop:build` 用于验证 Tauri + SQLite Rust 侧编译和打包。

## 后续清理条件

以下条件全部满足后，才能继续移除兼容层：

- `desktop:dev` 和 `desktop:build` 均可运行。
- SQLite 读写经过人工 smoke checklist。
- JSON 导入旧数据后能同步进入 SQLite。
- 静态 Web fallback 仍可打开并读写 localStorage。
- 有从 SQLite 导出 JSON 的确认路径。
