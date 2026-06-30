# Phase 5：Tauri 桌面端封装

本文档记录 Phase 5 的当前实现状态。Phase 5 的目标是把已经稳定的静态 Web 工作台封装为桌面端应用，而不是在同一阶段重写 UI、迁移 SQLite 或改变业务规则。

## 当前实现

- 新增 `src-tauri/`，作为 Tauri v2 桌面壳。
- 新增 `scripts/prepare-tauri-frontend.js`，把当前静态 Web 运行所需文件复制到 `dist/desktop`。
- `src-tauri/tauri.conf.json` 的 `frontendDist` 指向 `../dist/desktop`，避免直接把仓库根目录或 `node_modules` 作为桌面前端资源。
- 桌面壳加载的仍是现有 `index.html`、`data.js`、`src/core/rules/*.js`、`planner.js`、`app.js`。
- `index.html` 双击运行仍然保留，静态 Web 版本仍是 fallback。

## 命令

```text
npm.cmd run prepare:desktop
npm.cmd run verify:desktop
npm.cmd run desktop:dev
npm.cmd run desktop:build
```

命令说明：

- `prepare:desktop`：先构建 TypeScript core，再准备 `dist/desktop`。
- `verify:desktop`：运行 Phase 5 前置检查，并确认桌面前端资源可生成。
- `desktop:dev`：启动 Tauri 开发模式。
- `desktop:build`：构建 Tauri 桌面应用。

## 本机前置条件

运行 `desktop:dev` 或 `desktop:build` 需要本机安装 Rust / Cargo 和 Tauri 所需系统依赖。当前仓库已经具备 Tauri 配置和前端资源准备脚本；如果命令行找不到 `cargo` 或 `rustc`，需要先安装 Rust 工具链。

## 保留的兼容层

以下内容不是冗余，Phase 5 仍必须保留：

- `planner.js`：继续作为 `window.FitnessPlanner` 兼容导出层，供 `app.js` 和 smoke 测试使用。
- `src/core/rules/*.js`：浏览器和 Tauri 当前实际加载的 JS 输出。
- `index.html` 双击运行路径：作为桌面壳之外的 fallback。
- JSON 导入导出：作为当前主备份和迁移格式。

## 明确不做

- 不在 Phase 5 迁移 SQLite。
- 不重写 `app.js`。
- 不引入 React / Vue。
- 不改变 localStorage key。
- 不删除 JSON / CSV 导入导出路径。
- 不让 AI 或规则静默修改训练计划。
