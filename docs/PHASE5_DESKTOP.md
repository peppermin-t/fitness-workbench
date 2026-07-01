# Phase 5：Tauri 桌面端封装

本文档记录 Phase 5 的实现状态。Phase 5 的目标是把已经稳定的工作台前端封装为桌面端应用，而不是在同一阶段重写 UI 或改变业务规则；SQLite 已在后续 Phase 6 单独接入。

## 当前实现

- 新增 `src-tauri/`，作为 Tauri v2 桌面壳。
- 新增 `scripts/prepare-tauri-frontend.js`，把桌面前端源文件和运行所需脚本复制到 `dist/desktop`。
- `src-tauri/tauri.conf.json` 的 `frontendDist` 指向 `../dist/desktop`，避免直接把仓库根目录或 `node_modules` 作为桌面前端资源。
- 桌面壳加载的是由 `src/app/index.html` 生成的 `dist/desktop/index.html`，以及 `dist/desktop/src/core/data/fitness-data.js`、`dist/desktop/src/core/rules/*.js`、`dist/desktop/src/core/rules/facade.js`、`dist/desktop/src/app/**/*.js` 和 `app.js`。
- 根目录 `index.html` 双击入口已移除；当前运行入口统一为 Tauri 桌面端。

## 命令

```text
npm.cmd run prepare:desktop
npm.cmd run verify:desktop
npm.cmd run desktop:dev
npm.cmd run desktop:build:app
npm.cmd run desktop:build
```

命令说明：

- `prepare:desktop`：先构建 TypeScript core，再准备 `dist/desktop`。
- `verify:desktop`：运行 Phase 5 前置检查，并确认桌面前端资源可生成。
- `desktop:dev`：启动 Tauri 开发模式。
- `desktop:build:app`：构建 Tauri 桌面 exe，但跳过安装包打包。
- `desktop:build`：构建 Tauri 桌面应用并生成安装包，首次可能下载 WiX。

## 本机前置条件

运行 `desktop:dev` 或 `desktop:build` 需要本机安装 Rust / Cargo 和 Tauri 所需系统依赖。当前仓库已经具备 Tauri 配置和前端资源准备脚本；如果命令行找不到 `cargo` 或 `rustc`，需要先安装 Rust 工具链。

## 保留的聚合入口

以下内容不是冗余，Phase 5 仍必须保留：

- `src/core/rules/facade.ts`：继续作为 `window.FitnessCore.Rules` 统一规则入口；`app.js` 和 smoke 测试都直接使用该入口。
- `dist/desktop/src/**/*.js`：Tauri 当前实际加载的 JS 输出，由 `dist/generated/src/**/*.js` 复制而来，不再提交到源码目录。
- `src/app/index.html`：桌面前端源文件，不作为交付入口。
- JSON 导入导出：作为当前主备份和迁移格式。

## 明确不做

- SQLite 已在 Phase 6 单独接入，不回填到 Phase 5 范围。
- 不重写 `app.js`。
- 不引入 React / Vue。
- 不改变 localStorage key。
- 不删除 JSON / CSV 导入导出路径。
- 不让 AI 或规则静默修改训练计划。
