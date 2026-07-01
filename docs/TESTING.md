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
- `build:esm`：将 `.mts` ESM POC 编译到 `dist/esm`。
- `check:js`：检查生成后的 JS 语法。
- `smoke:rules`：在 Node VM 中运行规则 smoke。
- `test:backup`：验证自动备份快照不递归、数量限制和 JSON 可恢复。
- `test:commands`：验证 application command 的成功和 validation error 路径。
- `test:esm`：验证 ESM POC 可由 Node 直接 import。
- `test:goals`：验证目标解析枚举和核心字段。
- `test:invariants`：验证 session、set、advice、revision 和 plan patch 的 domain invariants。
- `test:portability`：验证 CSV/JSON portability，尤其是 CSV roundtrip。
- `test:queries`：验证 TodayDashboard read model DTO。
- `verify:frontend`：执行前端类型检查、JS 语法、规则 smoke、backup、commands、ESM、goals、invariants、portability 和 query 测试。
- `verify:desktop`：执行前端检查并准备 `dist/desktop`。
- `desktop:build:app`：构建 Tauri exe，不打安装包。
- `cargo test`：验证 SQLite 后端状态快照、核心表镜像、schema migration，以及样例 JSON 基线 round trip。

随着 ES Modules、application layer 和 SQLite 主存储推进，自动验证需要逐步扩展为：

- `core module tests`：直接 import domain/rules，不通过 `window.FitnessCore`。
- `command tests`：验证 application command 的 DTO validation、command result 和副作用。
- `query tests`：验证 Today、Plan、ExerciseHistory、WeeklyReview、NutritionProfile 等 read model DTO。
- `invariant tests`：验证 `WorkoutSession`、`ExerciseLog`、`SetLog`、`Advice`、`Revision` 和 plan patch 合法性。
- `migration tests`：验证空库、旧库和旧 JSON 样例能迁移到最新 schema。
- `repository tests`：验证 SQLite repository roundtrip 和 transaction rollback。
- `import/export roundtrip tests`：验证 JSON 和 CSV 不丢数据。
- `UI/e2e smoke`：验证今日训练 session lifecycle 的主路径。

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

后续规则 smoke 需要逐步拆成可 import 的 Node 测试。旧 HTML/VM smoke 可以保留一段时间作为兼容层验证，但不能作为最终唯一规则测试入口。

## PR 级验证策略

每个小切片至少运行与其风险匹配的验证，不能无测试大规模改动。

### CSV parser + tests

必须覆盖：

- 普通 CSV。
- 单元格包含逗号。
- 单元格包含双引号。
- 单元格包含换行。
- UTF-8 BOM。
- 空行。
- 导出后再导入的 roundtrip。

验收命令：

```text
npm.cmd run verify:desktop
```

如果新增独立测试脚本，需要在本文档记录命令。

### GoalPrimary 对齐

必须覆盖：

- `fat_loss`
- `muscle_gain`
- `strength`
- `general_fitness` 或最终确定的通用目标枚举。
- `maintenance` 或最终确定的维持目标枚举。
- `strength_maintenance` secondary goal。

验收：

- 类型检查通过。
- goal parser tests 通过。
- 旧规则 smoke 通过。

### Core rules ES module POC

必须同时验证：

- 新标准 import/export 测试通过。
- 旧 `window.FitnessCore.Rules` facade 仍可运行。
- 构建产物仍能被 Tauri 前端加载。

验收命令：

```text
npm.cmd run verify:desktop
```

### Application command

每个 command 至少覆盖：

- valid input -> success result。
- invalid input -> validation_error。
- not found input -> not_found。
- storage/repository failure -> storage_error 或明确错误结果。
- 成功写入后 query/read model 能读到结果。

`GeneratePlan` 额外验证：

- 当前目标、当前场地、身体指标和动作库参与计划生成。
- 返回的计划不直接依赖 UI state。

`SaveExerciseLog` / `LogExerciseSet` 额外验证：

- set 解析正确。
- `volumeLoad`、`hardSets`、`simplePr` 计算正确。
- 动作级 advice 带 evidence。
- session 与 exercise log 关联正确。

### 导入 / 重置前自动备份

必须覆盖：

- 导入 JSON 前创建当前状态备份。
- 恢复初始数据前创建当前状态备份。
- 备份 JSON 可重新导入。
- 导入失败时当前状态不被破坏。

### SQLite migration skeleton

必须覆盖：

- 空库初始化。
- 已有快照库迁移。
- 重复运行 migration 不重复应用。
- migration 失败时有恢复路径，至少保留旧 JSON 快照。

验收命令：

```text
cargo test --manifest-path src-tauri/Cargo.toml
```

## Session Lifecycle Smoke

今日训练重构后，人工和自动 smoke 都要围绕 session lifecycle，而不是单独表单：

```text
start session
-> log sets
-> quick feedback
-> finish session
-> generate advice/revision
-> refresh today query
```

最低验收：

- 能从今日页开始训练。
- 每个计划动作以卡片展示。
- 能在 5-10 秒内记录一组。
- 能复制上次重量 / 次数。
- 能记录快捷异常标签。
- 结束训练后生成 session summary。
- 动作日志、set logs、advice、revision candidates 可追溯。
- 不离开今日页能完成整次训练记录。

## 人工 Smoke

重构或较大功能改动后，至少手工确认：

- 应用能通过 `npm.cmd run desktop:dev` 打开。
- 首页能选择当前健身房。
- 能生成 / 刷新训练计划。
- 今日训练能选择训练日并展示动作。
- 今日训练重构后，能开始 session、记录 set、快捷反馈、结束 session。
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
