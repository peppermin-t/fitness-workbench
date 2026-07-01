# 架构与当前状态

本文档是当前维护入口。它替代早期的阶段计划、功能清单、数据模型草案和冗余审查文档。

## 重构状态

当前项目已经完成从旧静态脚本到 TypeScript + Tauri + SQLite 桥接的过渡，但这只是迁移中间态，不是最终架构形态。

已经完成：

- Phase 0 行为保护：已具备规则 smoke、样例 JSON 和人工验收路径。
- Phase 1/2 模块边界：核心规则已拆入 `src/core/rules/*`，但仍通过 `window.FitnessCore` 组合。
- Phase 3 数据底座：已有 `WorkoutSession`、`ExerciseLog`、`SetLog`、`schemaVersion` 规范化和导入保护。
- Phase 4 TypeScript：源码已全面转向 TS，根目录和 `src` 下不再提交 `.js` 源码。
- Phase 5 Tauri：桌面壳已接入。
- Phase 6 SQLite：Tauri 环境下已有 SQLite 状态快照和核心表镜像。

尚未完成：

- 标准 ES Modules、Vite bundler 和严格 TypeScript。
- application command / query 层。
- SQLite 作为明确 source of truth。
- React/Vite 组件化 UI。
- 今日训练的 session lifecycle 体验。
- Advice / Revision 的低噪音统一治理。

因此，`module: none`、`window.FitnessCore/FitnessApp` 和手动 script 顺序加载只能作为迁移中间态，不能作为长期维护形态。

## 当前运行模型

- 源码：`src/**/*.ts`
- 编译输出：`dist/generated/src/**/*.js`
- 桌面前端：`dist/desktop`
- 桌面壳：`src-tauri`
- UI 源文件：`src/app/index.html`、`src/app/styles.css`
- UI 启动入口：`src/app/main.ts`
- 规则统一入口：`window.FitnessCore.Rules`，由 `src/core/rules/facade.ts` 汇总。

浏览器和 Tauri WebView 仍然运行 JS，所以 `dist/generated` 和 `dist/desktop` 中存在 JS 是正常的；这些是构建产物，不是源码双份。

## 目标架构

最终目标架构是本地优先桌面应用：

```text
Tauri Desktop App
  -> UI Layer
     -> Vite + React + TypeScript
     -> feature-based pages/components
     -> local interaction state only
  -> Application Layer
     -> commands / use cases
     -> queries / read models
     -> DTO/schema validation
     -> transaction orchestration
  -> Domain Layer
     -> pure models / value objects
     -> deterministic rules
     -> progression / deload / substitution / recommendation policies
  -> Infrastructure Layer
     -> SQLite repositories
     -> migrations
     -> JSON backup/restore
     -> CSV import/export
     -> Tauri command bridge
  -> Testing Layer
     -> unit, golden, migration, repository, roundtrip, UI smoke
```

最终数据流必须收敛为：

```text
UI event
  -> application command
  -> DTO/schema validation
  -> repository query
  -> domain rules
  -> SQLite transaction
  -> app event / query refresh
  -> UI render
```

约束：

- UI 不直接 mutate `AppState`。
- UI 不直接依赖完整 `AppState`。
- 写操作只通过 application command / use case。
- 读操作通过 query/read model 返回页面所需 DTO。
- domain 层不访问 DOM、`window`、Tauri、SQLite、`localStorage`、toast、文件 API。
- SQLite 是业务 source of truth；JSON 是备份、恢复和迁移格式。

## ES Modules / Vite / Strict TypeScript 迁移

最终架构决策是标准 `import/export` + Vite bundler + strict TypeScript。迁移必须小步进行，不能一次性重写 UI。

迁移顺序：

1. 先把纯规则模块做 ES module POC，例如 `goal-parser`、`training-stats`、`data-portability`。保留兼容 facade，让旧 `window.FitnessCore.Rules` 继续可用。
2. 将 core rules 从 IIFE 改为显式导出，模块之间用 import，而不是读取 `window.FitnessCore.*`。
3. 引入 Vite 构建入口，先只 bundle core/application 层，HTML 仍可临时沿用旧结构。
4. 把 `src/core/models/index.d.ts` 拆成可 import 的 model/type 文件。
5. 逐步移除 `globals.d.ts` 中高频 `UnknownFn`，改为精确函数签名。
6. TypeScript 严格度分阶段开启：
   - 先开启 `noImplicitAny`，修掉隐式 any。
   - 再开启 `strictNullChecks`，明确 nullable DTO 和 repository 返回值。
   - 再开启 `noUncheckedIndexedAccess`，修正数组和 map 访问。
   - 最后开启 `strict`。
7. 当核心业务层不再依赖全局命名空间后，再推进 React/Vite UI 重构。

每一步都要保持现有规则 smoke、JSON 兼容和 Tauri 桌面入口可运行。

## Command / Query 分离

写操作走 command/use case，负责校验、事务和业务副作用。读操作走 query/read model，只返回页面需要的数据。

建议 command：

- `CreateGoal`
- `SetCurrentGoal`
- `CreateGym`
- `SetCurrentGym`
- `GeneratePlan`
- `StartWorkoutSession`
- `LogExerciseSet`
- `SaveExerciseQuickFeedback`
- `FinishWorkoutSession`
- `SaveBodyMetric`
- `SaveNutritionLog`
- `ApplyRevision`
- `DismissAdvice`
- `SnoozeAdvice`
- `ImportPlanCsv`
- `ImportBackupJson`
- `RestoreInitialData`

建议 query DTO：

- `TodayDashboardQueryDto`：当前目标、当前场地、推荐训练日、训练前提醒、今日高优先建议、当前 session 状态。
- `CurrentPlanQueryDto`：计划上下文、训练日、动作可用性、替代动作、待确认 revision。
- `ExerciseHistoryQueryDto`：动作历史、上次记录、PR、容量趋势、问题标签、疼痛风险。
- `WeeklyReviewQueryDto`：周统计、亮点、风险、下周候选调整、证据。
- `NutritionProfileQueryDto`：饮食记录、粗估置信度、蛋白/热量趋势、漏餐模式、训练联动提示。
- `BodyMetricTrendQueryDto`：体重、体脂、骨骼肌、腰围趋势和目标相关解释。
- `AdviceInboxQueryDto`：active/dismissed/applied/snoozed advice、去重后的展示分组和 revision 历史。

`AppState` 可以在迁移期作为兼容快照存在，但 UI 不应长期读取完整快照来渲染页面。

## Domain Invariants

核心模型必须有明确合法性约束，并由 DTO validation、domain factory 或 repository 边界共同保证。

`WorkoutSession`：

- `status` 只能是 `in_progress`、`completed`、`cancelled`。
- `startedAt` 必须存在。
- `completedAt` 只能在 `completed` 后存在。
- 同一 `date + planId + dayIndex` 同时最多一个非 cancelled active session。
- completed session 必须有 completion、rpe、painScore、sleep、fatigue。

`ExerciseLog`：

- 必须关联 `sessionId` 和 `exerciseId`。
- `date` 必须与 session 日期一致，除非显式补录。
- planned 字段来自当时计划快照，不应随计划修改而变化。
- `volumeLoad`、`hardSets`、`simplePr` 应由 `SetLog[]` 或明确规则计算得出。

`SetLog`：

- `setIndex` 从 1 开始，在同一 exercise log 内连续或可排序。
- `loadKg` 可以为 null 表示自重或未知，但不能为负数。
- `reps` 可以为 null 表示未记录，但不能为负数。
- `rpe` 为 null 或 1-10。
- `completed` 明确区分完成组、跳过组和失败组的后续扩展。

`Advice`：

- 必须有 `type`、`priority`、`title`、`detail/body`、`evidence`、`status`。
- `status` 只能是 `active`、`dismissed`、`applied`、`snoozed`、`reviewed`。
- 高优先建议必须有 evidence。
- 同类建议需要可去重，不应无限重复刷屏。

`Revision`：

- 必须有 `status`、`summary`、`reason`、`evidence`、`patch`、`createdAt`。
- `status` 只能是 `pending`、`applied`、`dismissed`。
- `appliedAt` 只能在 `applied` 后存在。
- 修改训练计划必须通过 revision，不能由规则静默写计划。
- 同一 patch signature 不应重复应用。

`TrainingPlan patch`：

- patch type 必须来自白名单，例如 `reduce_day_volume`、`trim_accessory`、`add_progression_note`、`increase_cardio_time`、`manual_replace`。
- `dayIndex`、`rowIndex` 必须落在当前计划范围内。
- 替换动作必须存在，并且要记录替换原因和 evidence。
- 降量 factor 必须在合理范围内，例如 `0.5 <= factor <= 1`。

## 训练执行模型

“今日训练”不是普通表单提交，而是 `WorkoutSession` lifecycle：

```text
start session
  -> create in_progress WorkoutSession
  -> render planned exercise cards
  -> log sets
  -> quick feedback tags
  -> finish session
  -> generate session summary
  -> generate advice / revision candidates
  -> refresh TodayDashboardQuery
```

今日页的核心操作：

- 开始训练：绑定当前目标、当前场地、当前计划和训练日。
- 记录每组：快速录入重量、次数、RPE、完成状态；支持复制上次重量/次数。
- 快捷反馈：疼痛、半程、小臂/握力先酸、目标肌肉没感觉、左右差、核心不稳、关节不适。
- 动作级总结：每个动作自动聚合 `SetLog[]` 和 quick feedback，形成 `ExerciseLog`。
- 结束训练：填写少量 session 级字段，生成整体反馈、动作反馈、advice 和 revision candidates。

验收重点是训练中 5-10 秒内完成一组记录，不需要离开今日页完成整次训练。

## React / Vite 引入标准

不要把 React/Vite 作为第一步全量重写。当前优先级仍是测试保护、类型边界、application 层和数据安全。

进入 React/Vite UI 重构的触发条件：

- 今日训练卡片化需要复杂局部状态。
- 每组快速记录、复制上次记录、快捷异常标签、结束训练面板开始压垮无框架 DOM。
- 条件渲染和页面局部刷新导致 `renderAll()` 耦合继续扩大。
- 页面 DTO 已经稳定，UI 可以只依赖 query result，而不是完整 `AppState`。
- core/application 层已能通过标准 import/export 被测试。

React 迁移策略：

- 先引入 Vite 构建和一个最小 React root。
- 先迁移 `TodayPage`，不同时重写所有页面。
- 保持旧页面可用，React 页面通过 application/query 层读写。
- 迁移完成一页就补对应 smoke，不做无测试大重写。

## PR 级优先切片

最高优先级切片拆分如下，每个切片应独立可验证：

1. CSV parser + tests
   - 涉及：`src/app/import-export/data-portability.ts`、测试脚本。
   - 内容：实现 RFC 4180 基础解析，覆盖逗号、引号、换行、BOM、空行。
   - 验证：CSV roundtrip test、`npm.cmd run verify:desktop`。

2. GoalPrimary 对齐
   - 涉及：`src/core/models/index.d.ts`、`src/core/rules/goal-parser.ts`、规则测试。
   - 内容：统一 `general_fitness`、`maintenance` 等枚举语义，避免类型与实现不一致。
   - 验证：goal parser tests、规则 smoke。

3. Core rules ES module POC
   - 涉及：选一个低耦合规则模块和 build/test 配置。
   - 内容：新增标准 export，同时保留旧 window facade。
   - 验证：Node import test + 旧 smoke 双通。

4. `GeneratePlan` use case
   - 涉及：新增 `src/application/commands/generate-plan.ts`，旧 UI 只做薄适配。
   - 内容：typed input、validation、调用 domain rule、返回 command result。
   - 验证：use case 单测、现有生成计划 smoke。

5. `SaveExerciseLog` / `LogExerciseSet` use case
   - 涉及：application command、set parsing、training stats。
   - 内容：先保留旧表单，但写入路径改由 use case 承接。
   - 验证：set parsing、volume/hard sets/simple PR、exercise advice tests。

6. 导入 / 重置前自动备份
   - 涉及：backup service、JSON import/reset 流程、Tauri 存储。
   - 内容：导入 JSON 和恢复初始数据前创建 backup snapshot。
   - 验证：backup JSON roundtrip、旧样例导入、reset 前备份存在。

7. SQLite migration skeleton
   - 涉及：`src-tauri` migrations、schema_migrations。
   - 内容：建立 migration runner，不急着拆完整业务表。
   - 验证：空库 migrate、旧库 migrate、样例 JSON roundtrip。

## 功能边界

当前工作台支持：

- 目标设定与自然语言目标解析。
- 健身房 / 场地器械管理。
- 动作库查看、搜索和基础自定义动作补充。
- 按目标、身体指标和当前器械生成训练计划。
- 今日训练查看、训练日选择和动作替代。
- 训练整体反馈、动作级反馈、动作历史和动作长期画像。
- 身体指标记录与趋势图。
- 饮食自然语言记录、营养估算、饮食趋势和饮食画像。
- 今日建议、训练前提醒、饮食前提醒、智能教练建议和周复盘。
- JSON 备份 / 恢复、CSV 训练计划导入 / 导出。
- Tauri 环境下 SQLite 本地存储桥接。

当前明确不做：

- 云同步、账号系统、社交、公开课程平台。
- 完整营养数据库、扫码饮食、医学诊断或康复处方。
- 视频动作识别、手机端、手表端。
- AI 静默修改训练计划。

## 代码结构

```text
src/app/main.ts                         UI 启动、事件绑定、渲染调度
src/app/index.html                      桌面前端 HTML 源文件
src/app/styles.css                      桌面前端样式源文件
src/app/state/workbench-actions.ts      状态写入和业务动作
src/app/storage/*                       状态规范化、localStorage、Tauri SQLite 桥接
src/app/import-export/*                 JSON / CSV 构造和解析
src/app/io/*                            浏览器文件读取和下载
src/app/charts/*                        canvas 图表
src/app/presenters/*                    展示文案、格式化、标签
src/app/render/*                        页面 HTML 模板
src/core/data/fitness-data.ts           内置器械、动作和默认场地
src/core/models/index.d.ts              核心模型声明
src/core/rules/*                        目标、计划、反馈、饮食、指标、周复盘等规则
src/core/types/globals.d.ts             浏览器全局对象声明
src-tauri/*                             Tauri 桌面端和 SQLite 后端
```

## 数据模型

核心状态是一个 `AppState` 快照：

- `schemaVersion`
- `currentGymId`
- `currentGoalId`
- `gyms`
- `exercises`
- `goals`
- `metrics`
- `plan`
- `sessions`
- `exerciseLogs`
- `nutritionLogs`
- `feedback`
- `advice`
- `revisions`

训练相关主模型：

- `Goal`
- `Gym`
- `Exercise`
- `TrainingPlan`
- `WorkoutDay`
- `PlannedExercise`
- `WorkoutSession`
- `ExerciseLog`
- `SetLog`
- `BodyMetricEntry`
- `NutritionLog`
- `Advice`
- `Revision`

SQLite 当前用于 Tauri 环境下的本地持久化：保存完整状态快照，并镜像主要业务表。JSON 仍然是备份、导入导出和迁移安全网。

## 当前技术债

优先级较高：

- `src/app/main.ts` 仍然偏大，主要承担事件绑定、表单读取、渲染调度和保存后刷新；DOM 查询与 toast 控制已下沉到 `src/app/ui/dom-utils.ts`。
- `globals.d.ts` 已移除宽泛的 `Function` 类型，改为 `UnknownFn` 边界；后续可继续把高频模块替换为精确函数签名，减少调用处类型桥接。
- SQLite 已有后端 round trip 测试，并新增基于 `docs/sample-data/manual-smoke-baseline.json` 的真实状态镜像 smoke；后续如继续增强，可补 Tauri command 层的端到端测试。
- 人工 smoke checklist 现在合并到 `docs/TESTING.md`，仍需要实际人工执行。

优先级较低：

- 将 `src/core/data/fitness-data.ts` 再拆成 `equipment-data`、`exercise-data`、`seed-gyms`。
- 将 `src/app/main.ts` 的事件绑定进一步拆为 `app/events`。
- 增加更细粒度规则单元测试。

## 文档维护原则

不要再为每个小阶段新增独立文档。后续改动优先更新：

- 功能 / 架构变化：更新本文档。
- 验证方式变化：更新 `docs/TESTING.md`。
- 产品定位变化：更新 `docs/PRODUCT_VISION.md`。
- 长期有效的架构决策：更新 `docs/DECISIONS.md`。
