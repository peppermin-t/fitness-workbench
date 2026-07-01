# 验证与验收

本文档集中维护自动验证、规则 smoke、人工验收和样例数据说明。

## 自动验证

日常改代码后建议运行：

```text
npm.cmd run check:core
npm.cmd run verify:desktop
cargo test --manifest-path src-tauri/Cargo.toml
```

发布或阶段性基线前再运行：

```text
npm.cmd run desktop:build:app
```

命令含义：

- `check:core`：TypeScript 类型检查，不生成产物。
- `build:core`：将 TS 编译到 `dist/generated`。
- `check:js`：检查生成后的 JS 语法。
- `smoke:rules`：在 Node VM 中运行规则 smoke。
- `verify:desktop`：执行前端检查并准备 `dist/desktop`。
- `desktop:build:app`：构建 Tauri exe，不打安装包。
- `cargo test`：验证 SQLite 后端状态快照、核心表镜像，以及样例 JSON 基线 round trip。

## 规则 Smoke

浏览器方式：

```text
npm.cmd run build:core
```

然后打开：

```text
tests/rules-smoke.html
```

命令行方式：

```text
npm.cmd run smoke:rules
```

当前规则 smoke 覆盖：

- `parseGoal`
- `generatePlan`
- `analyzeExerciseFeedback`
- `parseNutritionLog`
- `metricTrend`
- `buildWeeklyReview`

当前期望结果：

```text
rules-smoke: 12/12 passed, 0 failed
```

注意：`parseGoal` 对“保持力量”相关表达仍有长期增强空间。当前 smoke 以保护现有行为为主，不把规则增强和结构重构混在一起。

## 人工 Smoke

重构或较大功能改动后，至少手工确认：

- 应用能通过 `npm.cmd run desktop:dev` 打开。
- 首页能选择当前健身房。
- 能生成 / 刷新训练计划。
- 今日训练能选择训练日并展示动作。
- 能保存训练整体反馈。
- 能保存动作级反馈并生成建议。
- 目标设定能解析并保存。
- 健身房能新增、选择器械、设为当前场地。
- 身体指标能新增并显示趋势。
- 饮食自然语言记录能保存、估算和删除。
- 训练计划能导出 / 导入 CSV。
- 动作库能搜索并显示当前场地可做 / 缺器械。
- 智能教练能展示 advice、revision、动作画像、饮食画像和周复盘。
- JSON 能导出、导入和恢复初始数据。

## 样例数据

样例备份位于：

```text
docs/sample-data/manual-smoke-baseline.json
```

它用于人工验收，至少应包含：

- 1 个当前目标。
- 2 个健身房，其中一个完整健身房，一个酒店 / 少器械场地。
- 1 份训练计划。
- 2 条身体指标。
- 1 条训练整体反馈。
- 2 条动作级反馈。
- 1 条饮食记录。
- 1 条智能建议。
- 1 条 revision。

使用方式：

1. 启动桌面端。
2. 打开“导入导出”页。
3. 导入上述 JSON。
4. 按人工 smoke 清单检查页面是否正常渲染。

SQLite 后端测试也会加载这份样例 JSON，验证完整状态快照可以写入、读回，并镜像到 `goals`、`gyms`、`training_plans`、`workout_sessions`、`exercise_logs`、`set_logs`、`body_metrics`、`nutrition_logs`、`advice` 和 `revisions` 等核心表。

## 验收标准

进入下一轮较大重构前，应满足：

- TypeScript 检查通过。
- 规则 smoke 通过。
- SQLite 后端测试通过。
- Tauri exe 构建通过。
- 样例 JSON 可导入。
- 核心页面人工 smoke 无明显回退。
