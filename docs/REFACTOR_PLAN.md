# 后续重构计划

本文档规划从当前静态 Web 工作台到长期桌面端应用的技术路线。长期目标明确是：TypeScript core + Tauri 桌面端 + SQLite 本地数据库。当前已经完成 TypeScript core 最小迁移、Phase 5 最小 Tauri 壳接入和 Phase 6 SQLite 存储桥接，但仍然保持 `index.html` 直接双击可用，不删除现有功能。

当前已经进入 Tauri / SQLite 路线，但仍不应继续扩大到细粒度 SQL 查询重写、云同步或多端同步。v0.2 的 `WorkoutSession`、`SetLog`、`schemaVersion` 迁移、数据导入导出稳定性、规则 smoke 测试和人工 smoke checklist 仍需要持续约束后续迁移。数据底座和行为保护没有完全固化之前，继续扩大技术面会放大回退风险。

## 总体路线

```text
Phase 0：现状冻结与行为保护
Phase 1：JS 模块边界收敛
Phase 2：核心规则行为保持型拆分
Phase 3：v0.2 数据底座补齐
Phase 4：TypeScript core 迁移
Phase 5：Tauri 桌面端封装
Phase 6：SQLite 本地数据库迁移
Phase 7：AI 结构化解析与多端扩展
```

## 当前阶段状态

- Phase 0：文档、人工 smoke checklist、规则 smoke、样例 JSON 基线和 git 基线已具备。
- Phase 1：JS 模块边界已收敛到 `src/core/rules` 与 `src/app/storage`，浏览器全局兼容层仍保留。第一轮应用侧清理已把默认状态、localStorage 读写和 Tauri SQLite hydration helper 收到 `src/app/storage/app-state-store.js`。
- Phase 2：核心规则拆分已收口。`planner.js` 已收窄为 `window.FitnessPlanner -> window.FitnessCore.Rules` 的兼容别名；`app.js` 当前直接使用 `window.FitnessCore.Rules`。无依赖规则 smoke 已覆盖 12 个核心用例。
- Phase 3：已完成第一版：`SetLog` 可选记录、`WorkoutSession` 状态与动作日志关联、基础训练容量统计、`schemaVersion: 2`、JSON 导入稳定性和当前状态规范化已经具备。
- Phase 4：已完成最小迁移：新增 TypeScript 配置、模型声明、全局声明，核心规则和状态规范化已有 `.ts` 源文件，并继续生成 `.js` 兼容输出。
- Phase 5：最小 Tauri 壳已接入，桌面前端资源由 `npm.cmd run prepare:desktop` 生成。
- Phase 6：SQLite 存储桥接已接入。Tauri 环境中会通过 SQLite 保存 / 读取完整状态快照，并镜像核心业务表；静态 Web fallback 继续使用 localStorage。

## 当前阶段边界

当前阶段已经引入最小 npm / TypeScript 检查链，仅用于 core 类型检查和生成 JS 兼容输出。
当前阶段已接入最小 Tauri 壳。
当前阶段已接入 SQLite 存储桥接，但保留 localStorage 和 JSON 回退路径。
当前阶段仍然不破坏 `index.html` 双击运行。

当前优先完成：

- 收紧已迁移 core 模块的 TypeScript 类型。
- 持续维护 `WorkoutSession`、`SetLog`、`schemaVersion` 迁移和 JSON 导入导出稳定性。
- 保持规则 smoke 测试和人工 smoke checklist 可运行。
- 在继续移除兼容层前保留静态 Web fallback、localStorage 和 JSON 回退路径。
- 继续把 `app.js` 中的复杂渲染模板和业务状态写入职责分批拆出。

## Phase 0：现状冻结与行为保护

状态：基本完成，剩余项是人工执行和版本基线，不是业务代码重构。

### 目标

在改代码结构前，把当前行为冻结下来，防止后续重构出现功能回退。

### 工作内容

1. 确认当前功能
   - 以 `docs/CURRENT_FEATURES.md` 为功能清单。
   - 对每个页面列出至少一条人工验收路径。
   - 明确当前“已完成”和“偏弱但可用”的边界。

2. 增加 smoke test 或人工验收清单
   - 当前先以 [SMOKE_CHECKLIST.md](SMOKE_CHECKLIST.md) 作为人工验收文档。
   - 当前先以 [RULE_TEST_CASES.md](RULE_TEST_CASES.md) 固定核心规则输入输出样例。
   - 后续可增加轻量 JS 测试，直接调用 `window.FitnessPlanner` 暴露的纯函数。
   - 第一批测试应覆盖目标解析、计划生成、动作反馈分析、饮食解析、周复盘。

3. 确保导入导出可用
   - 手工验证 JSON 导出。
   - 手工验证 JSON 导入后页面能渲染。
   - 手工验证 CSV 计划导出。
   - 手工验证 CSV 计划导入。

4. 保留一个可回退基线
   - 在正式重构前创建 git 分支或 tag。
   - 按 [SAMPLE_DATA_GUIDE.md](SAMPLE_DATA_GUIDE.md) 保存一份当前可用 JSON 样例数据。
   - 后续每个阶段都必须能回退到该基线对照。

### 验收标准

- 文档清楚列出当前功能和缺口。
- 至少有一份 smoke checklist。
- JSON / CSV 导入导出路径明确可用。
- 当前工作树有可回退基线，且有样例备份数据准备说明。

## Phase 1：JS 模块边界收敛

状态：已完成。规则模块已落地，后续 Phase 4 在不改变静态运行方式的前提下引入 TypeScript core 检查链。

### 目标

先用零构建链的 JS 模块收敛边界，不急于全面改写。保持 UI 行为不变，仍支持 `index.html` 直接运行。

### 建议目录

```text
src/
  core/
    models/
    rules/
  app/
    state/
    storage/
```

在真正引入构建链前，可以先以文档、JSDoc 和浏览器全局对象方式过渡。不要为了 TypeScript 立刻破坏现有静态运行方式。

### `src/core/models`

负责定义核心模型：

- `AppState`
- `Goal`
- `Gym`
- `Equipment`
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

第一步可以从 `docs/DATA_MODEL_DRAFT.md` 复制为类型草案。

### `src/core/rules`

负责纯业务规则：

- 目标解析。
- 计划生成。
- 动作反馈分析。
- 饮食解析。
- 指标趋势。
- 联动信号。
- 周复盘。
- 建议生成。

这些函数应尽量只接收数据、返回数据，不直接读写 DOM 和 localStorage。

### `src/app/state`

负责应用状态组织：

- 默认状态。
- 当前目标 / 当前健身房选择。
- 保存目标、健身房、指标、训练反馈、动作日志、饮食记录。
- 调用 core 规则后合并结果。

当前 `app.js` 中的 `defaultState`、`loadState`、`saveState`、各类 `save*` 函数可以逐步迁移到这里。

### `src/app/storage`

负责本地存储：

- localStorage key。
- JSON 导入导出。
- schemaVersion。
- 数据迁移。
- 导入校验。

当前 `app.js` 中的 `loadState`、`saveState`、`exportJson`、`importJson`、`resetData` 可逐步迁移。

### 保持 UI 行为不变

Phase 1 不应改页面结构和交互。即使内部开始拆模块，也要保证：

- 旧按钮仍可用。
- 数据仍保存在 localStorage。
- JSON 数据仍能导入。
- 计划 CSV 仍能导入 / 导出。
- 智能建议不静默改计划。

## Phase 2：核心规则行为保持型拆分

状态：已收口。

### 目标

从 `planner.js` 拆出纯业务模块，降低单文件复杂度。拆分时先移动函数，不改业务语义。

### 建议拆分模块

#### 1. `goal-parser`

状态：已完成。

说明：`parseGoal` 已从 `planner.js` 拆到 `src/core/rules/goal-parser.js`，并通过 `window.FitnessPlanner.parseGoal` 保持兼容。`index.html` 和 `tests/rules-smoke.html` 都在 `planner.js` 前加载该文件。

来源函数：

- `parseGoal`

职责：

- 自然语言目标解析。
- 输出固定 `GoalParsed`。
- 不关心 UI 和存储。

测试重点：

- 减脂到目标体重。
- 增肌。
- 力量提升。
- 出差、训练频率、训练时长。

#### 2. `plan-generator`

状态：已完成。

说明：`generatePlan`、`buildPlanDay`、`planDayTypes`、`planConfig`、`defaultRowNote`、`pickAvailableExercise`、`buildPlanContext`、`isAvailable`、`availableSubstitutes` 已拆到 `src/core/rules/plan-generator.js`，并通过 `window.FitnessPlanner` 保持兼容导出。`index.html` 和 `tests/rules-smoke.html` 都在 `planner.js` 前加载该文件。

来源函数：

- `generatePlan`
- `buildPlanDay`
- `planDayTypes`
- `planConfig`
- `defaultRowNote`
- `pickAvailableExercise`
- `buildPlanContext`
- `isAvailable`
- `availableSubstitutes`

职责：

- 根据目标、场地、动作库、指标生成计划。
- 根据器械可用性选择动作和替代动作。

测试重点：

- 酒店健身房不推荐不可用器械。
- 训练天数映射正确。
- 减脂目标包含有氧 / 恢复日。

#### 3. `exercise-feedback-analyzer`

状态：已完成。

说明：`analyzeExerciseFeedback`、`buildExerciseProfiles`、`computeExercisePriority`、`inferExerciseProfileAdvice` 已拆到 `src/core/rules/exercise-feedback-analyzer.js`；其中既有外部入口 `analyzeExerciseFeedback`、`buildExerciseProfiles` 继续通过 `window.FitnessPlanner` 保持兼容导出。该模块依赖 `window.FitnessCore.AdviceEngine`，不反向依赖 `window.FitnessPlanner`。

来源函数：

- `analyzeExerciseFeedback`
- `buildExerciseProfiles`
- `computeExercisePriority`
- `inferExerciseProfileAdvice`

职责：

- 单次动作反馈分析。
- 动作长期画像。
- 输出标签、证据、建议项。

测试重点：

- 半程 + 高 RPE。
- 左右差异。
- 握力限制。
- 目标肌肉感觉弱。
- 疼痛风险。

#### 4. `nutrition-parser`

状态：已完成。

说明：`FOOD_LIBRARY`、`parseNutritionLog`、饮食餐次拆分、食物识别、营养估算、饮食建议、饮食画像、饮食趋势和饮食前提醒已拆到 `src/core/rules/nutrition-parser.js`，并通过 `window.FitnessPlanner` 保持兼容导出。

来源函数：

- `FOOD_LIBRARY`
- `parseNutritionLog`
- `splitMeals`
- `extractFoodItems`
- `nutritionTagsFor`
- `nutritionTargets`
- `evaluateNutritionDay`
- `buildNutritionRecommendationItems`
- `buildNutritionProfile`
- `buildNutritionTrend`

职责：

- 饮食文本解析。
- 粗略营养估算。
- 饮食标签和建议。
- 饮食画像和趋势。

测试重点：

- “5 个蛋白、地瓜、豆浆、威化、牛肉火锅”。
- 漏午餐。
- 蛋白缺口。
- 高油 / 高钠外食。

#### 5. `metric-analyzer`

状态：已完成。

说明：`sortedMetrics`、`metricTrend` 已拆到 `src/core/rules/metric-analyzer.js`，并通过 `window.FitnessPlanner` 保持兼容导出。`plan-generator` 通过 `window.FitnessCore.MetricAnalyzer` 读取指标排序和趋势计算。

来源函数：

- `sortedMetrics`
- `metricTrend`

职责：

- 身体指标排序。
- 指标趋势计算。

测试重点：

- 日期排序。
- 近 21 / 30 天趋势。
- 空数组和缺失字段。

#### 6. `integrated-signals`

状态：已完成。

说明：`buildIntegratedSignals`、`buildTrainingReminders`、`buildLinkedTodayInsights` 和联动提醒去重等 helper 已拆到 `src/core/rules/integrated-signals.js`，并通过 `window.FitnessPlanner` 保持兼容导出。

来源函数：

- `buildIntegratedSignals`
- `compareSessionWindows`
- `sortedSessions`

职责：

- 训练、饮食、身体指标联动判断。
- 输出结构化 `RecommendationItem[]`。

测试重点：

- 减脂体重平台 + 饮食干扰项。
- RPE 升高 + 午餐缺失。
- 减脂期训练表现下滑 + 蛋白缺口。

#### 7. `weekly-review`

状态：已完成。

说明：`buildWeeklyReview`、`revision`、周复盘候选去重和候选定位 helper 已拆到 `src/core/rules/weekly-review.js`，并通过 `window.FitnessPlanner.buildWeeklyReview` 保持兼容导出。计划调整候选仍需要用户确认后才会应用。

来源函数：

- `buildWeeklyReview`
- `findConditioningDayIndex`
- `dedupeCandidates`

职责：

- 近 7 天复盘。
- 下周优先项。
- 计划调整候选。

测试重点：

- 疼痛触发降量候选。
- 完成度低触发精简候选。
- 稳定训练触发进阶候选。
- 减脂体重上升触发有氧候选。

#### 8. `advice-engine`

状态：已完成 helper 拆分与第一轮清理；`createAdviceFromSession` 已并入 `src/core/rules/advice-engine.js`，`planner.js` 不再保留业务规则实现。

说明：`recommendationItem`、`buildAdviceEntry`、`sortRecommendationItems`、`highestPriority`、`priorityScore`、`priorityLabel`、`uniqueStrings`、`revision`、`createAdviceFromSession` 已拆到 `src/core/rules/advice-engine.js`。`src/core/rules/facade.js` 汇总为 `window.FitnessCore.Rules`，`planner.js` 只保留 `window.FitnessPlanner` 兼容别名。

来源函数：

- `createAdviceFromSession`
- `buildAdviceEntry`
- `recommendationItem`
- `sortRecommendationItems`
- `highestPriority`
- `priorityScore`
- `priorityLabel`
- `uniqueStrings`
- `revision`

职责：

- 统一建议结构。
- 优先级排序。
- 证据和推荐项格式。

测试重点：

- 高优先级排序。
- advice 字段完整。
- 无触发规则时输出低优先级观察建议。

### Phase 2 验收标准

- `planner.js` 已变薄为兼容别名，不再保留业务规则实现。
- 拆出的函数通过 `window.FitnessCore.*` 暴露，并由 `window.FitnessCore.Rules` 提供统一 core facade；`window.FitnessPlanner.*` 继续保持旧入口兼容。
- 无依赖规则 smoke 已覆盖 12 个核心用例，包括目标解析、计划生成、动作反馈、饮食解析、指标趋势、训练容量统计、周复盘、联动建议、训练前提醒和饮食前提醒。
- `index.html` 仍按静态脚本顺序加载，不需要构建链，不改变 UI 行为。

## Phase 3：v0.2 数据底座补齐

### 目标

在核心边界清楚后，补齐当前最影响长期发展的数据底座。

### 1. 每组级训练记录

状态：已完成第一版。

新增 `SetLog` 模型，并在 `ExerciseLog` 内增加可选 `sets`。

最小 UI 可以是：

- 默认仍允许快速填写 `actualLoad` 和 `actualReps`。
- 提供“展开每组记录”。
- 每组填写重量、次数、RPE、备注。

重点是不增加普通记录负担。

当前实现：

- 动作反馈表单保留 `actualLoad` 和 `actualReps` 快速填写。
- 新增可选“每组记录”文本框。
- 不填写每组记录时，会尽量从 `actualLoad` 和 `actualReps` 推导 `sets`。
- `ExerciseLog.sets` 使用 `loadKg`、`reps`、`rpe`、`completed`、`note` 等字段。

### 2. `WorkoutSession` 状态

状态：已完成第一版。

将当前整体反馈扩展为更清晰的 session：

- 当前阶段可先只创建 `completed` session。
- 动作日志保存时带上 `sessionId`。
- 今日训练选择训练日时可以创建或复用当天 session。

当前实现：

- `WorkoutSession.status` 支持 `in_progress` 和 `completed`。
- 保存动作日志时会为当天训练日创建或复用 session，并写入 `ExerciseLog.sessionId`。
- 保存训练整体反馈时会复用当天训练日 session，并标记为 `completed`。
- 周复盘和联动判断只统计 `completed` 或旧数据中没有 `status` 的 session，避免进行中 session 污染统计。

### 3. 基础训练容量统计

状态：已完成第一版。

在有 `SetLog` 后增加纯函数：

- `calculateVolumeLoad`
- `calculateHardSets`
- `detectSimplePr`

v0.2 可以先在智能教练或动作历史里少量展示，不做复杂报表。

当前实现：

- 新增 `src/core/rules/training-stats.js`。
- 通过 `window.FitnessPlanner.calculateVolumeLoad`、`window.FitnessPlanner.calculateHardSets`、`window.FitnessPlanner.detectSimplePr` 保持兼容导出。
- 动作日志保存时写入 `volumeLoad`、`hardSets`、`simplePr`。
- 动作反馈列表和动作历史摘要展示容量、有效组和 PR 计数。

### 4. 数据迁移

当前状态：

- `schemaVersion` 已固定为 `2`。
- 一次性 v1 到 v2 迁移代码已移除。
- 当前保留状态规范化和导入保护：为缺失数组、session 字段、动作日志统计字段、计划日 / 计划动作 ID、advice / revision 状态补默认值。

状态：已完成第一版。

当前实现：

- 新增 `src/app/storage/state-normalizer.js`。
- `CURRENT_SCHEMA_VERSION` 当前为 `2`。
- `loadState`、`saveState`、`exportJson` 和 `importJson` 都会经过当前状态规范化。
- JSON 导入会先解析和迁移，成功后才覆盖 localStorage，避免坏 JSON 直接破坏本地数据。

### 5. 规则测试

优先测试纯函数，不测试 DOM：

- 目标解析。
- 计划生成。
- 动作反馈分析。
- 饮食解析。
- 指标趋势。
- 周复盘。
- 数据迁移。

状态：已完成第一版。

当前 `tests/rules-smoke.html` 覆盖 12 个用例，新增覆盖训练容量统计。

### Phase 3 验收标准

- 老 JSON 导入后不丢数据，且导入失败不会覆盖旧 localStorage。
- 新数据能记录可选每组日志。
- 训练整体反馈和动作级反馈能通过 session 关联。
- `schemaVersion: 2` 状态可规范化保存和导出。
- 至少关键规则有基础测试，当前 smoke 为 12 passed / 0 failed。

## Phase 4：TypeScript core 迁移

状态：已完成最小迁移，后续重点是逐模块收紧类型，而不是继续扩大技术栈。

Phase 4 是长期技术路线的一部分。当前执行方式是最小迁移：引入 TypeScript core 源文件和检查命令，但保留静态 Web 版本可运行，避免一次性技术迁移造成行为回退。

### 目标

把当前已经拆出的 `src/core/rules/*`、`src/app/storage/state-normalizer` 和核心模型声明逐步迁移为 TypeScript，形成可测试、可复用、可被桌面端和后续多端共享的业务 core。

### 前置条件

- `WorkoutSession`、`ExerciseLog`、`SetLog` 模型稳定。
- `schemaVersion` 迁移机制已经存在。
- 规则 smoke 测试可运行。
- JSON 样例数据可导入。
- `window.FitnessPlanner` 兼容层行为已经冻结。

### 建议步骤

1. 新增最小 TypeScript 配置，但不急着改 UI。已完成：`package.json`、`package-lock.json`、`tsconfig.json`。
2. 先迁移纯模型。已完成第一版：`src/core/models/index.d.ts`。
   - `src/core/models`
   - `AppState`
   - `Goal`
   - `Gym`
   - `Exercise`
   - `TrainingPlan`
   - `WorkoutSession`
   - `ExerciseLog`
   - `SetLog`
   - `NutritionLog`
   - `Advice`
   - `Revision`
3. 再迁移纯规则。已完成第一版：`src/core/rules/*.ts`，并保留同名 `.js` 兼容输出。
   - `goal-parser`
   - `plan-generator`
   - `exercise-feedback-analyzer`
   - `nutrition-parser`
   - `metric-analyzer`
   - `integrated-signals`
   - `weekly-review`
   - `advice-engine`
4. 保留 JS 兼容入口，避免一次性改坏运行方式。已完成：`index.html` 仍加载 `.js`，`app.js` 已从 `window.FitnessPlanner` 切到 `window.FitnessCore.Rules`。
5. 后续逐个模块移除过渡性的 `// @ts-nocheck`，补充更精确的输入输出类型。
6. 等 core 稳定后再考虑 UI 层迁移。

### 已落地文件

- `tsconfig.json`
- `package.json`
- `package-lock.json`
- `src/core/models/index.d.ts`
- `src/core/types/globals.d.ts`
- `src/core/rules/*.ts`
- `src/core/rules/facade.ts`
- `src/app/storage/state-normalizer.ts`
- `src/app/storage/app-state-store.ts`
- `src/app/import-export/data-portability.ts`
- `src/app/charts/line-chart.ts`
- `src/app/presenters/display-formatters.ts`
- 同名 `.js` 兼容输出，继续供 `index.html` 直接加载。

### 当前限制

- 已迁移的规则 `.ts` 文件仍使用 `// @ts-nocheck` 作为过渡措施，确保本阶段只迁移源形态和构建链，不混入规则改写。
- `window.FitnessPlanner` 兼容 API 仍保留给旧入口和 smoke 兼容；当前 UI 入口已改为 `window.FitnessCore.Rules`。
- Phase 4 完成不代表可以立即进入 SQLite；数据库迁移仍必须等 Tauri 壳、模型和迁移保护进一步稳定。

### 非目标

- 不在这个阶段重写 UI。
- 不在这个阶段引入 React / Vue。
- 不在这个阶段直接接 SQLite。
- 不在这个阶段直接做 AI。
- 不在这个阶段破坏已有 JSON 导入导出。

## Phase 5：Tauri 桌面端封装

状态：已完成最小接入。Tauri 壳、前端资源准备脚本和 npm 命令已落地；当前环境缺少 Rust / Cargo，因此尚未在本机生成桌面二进制。

Phase 5 的目标是桌面端封装，不是用桌面壳掩盖尚未稳定的数据模型。Tauri 是长期路线中的桌面端优先选择，但必须排在 TypeScript core 和迁移保护之后。

### 目标

将已经稳定的 TypeScript core 和现有工作台 UI 封装为桌面端应用。

### 前置条件

- TypeScript core 已稳定。
- 数据模型和迁移机制稳定。
- JSON 导入导出稳定。
- 规则测试和人工 smoke checklist 可跑。
- 当前静态 Web 版本仍然可运行，作为 fallback。
- 进入 Phase 5 前先运行 `npm.cmd run verify:phase5`，并参考 [PHASE5_PREPARED.md](PHASE5_PREPARED.md) 完成人工确认。

### 建议步骤

1. 新建 Tauri 壳。
2. 先加载现有前端页面。
3. 保留本地 JSON 导入导出。
4. 增加桌面端文件保存 / 读取能力。
5. 再逐步考虑自动备份、配置目录、日志等桌面能力。

当前已完成第 1-3 步的最小版本：`src-tauri/` 已存在，`dist/desktop` 由 `scripts/prepare-tauri-frontend.js` 生成，静态 Web fallback 保留。第 4-5 步应在确认 Tauri dev/build 可运行后再做。

### 非目标

- 不在刚上 Tauri 时立刻引入 SQLite。
- 不立即做云同步。
- 不立即做账号系统。
- 不立即做复杂多端同步。

## Phase 6：SQLite 本地数据库迁移

状态：已完成第一版桥接实现。SQLite 只在 Tauri 环境启用；普通浏览器和双击 `index.html` 继续使用 localStorage。

Phase 6 是长期本地数据存储路线。当前实现采用“完整状态快照 + 结构化镜像表”的保守方案，先保证数据不丢和 JSON 回退路径不变，再逐步迁移到更细粒度的 SQL 查询。

### 目标

从 localStorage / JSON 状态迁移到本地 SQLite，提高长期训练日志、动作日志、身体指标、饮食记录和建议记录的可查询性和可靠性。

### 前置条件

- Tauri 壳稳定。
- 数据模型稳定。
- `schemaVersion` 迁移机制成熟。
- JSON 备份仍然可导出。
- 有从旧 JSON 导入 SQLite 的迁移路径。

### 已建表

当前 `src-tauri/src/lib.rs` 会初始化：

```text
goals
gyms
exercises
training_plans
workout_days
planned_exercises
workout_sessions
exercise_logs
set_logs
body_metrics
nutrition_logs
advice
revisions
```

### 迁移原则

- JSON 仍作为备份 / 导入导出格式。
- SQLite 是运行时主存储。
- 老 JSON 必须可以迁移。
- 迁移失败不能丢数据。
- 每次 schema 变更都要有迁移记录。

### 当前限制

- `npm.cmd run verify:desktop` 已通过。
- `npm.cmd run desktop:build:app` 已可编译出桌面 exe。
- `npm.cmd run desktop:build` 会继续生成安装包，首次可能下载 WiX；安装包工具链不应阻塞 SQLite 存储桥接的代码基线。

## Phase 7：AI 结构化解析与多端扩展

Phase 7 放在 TypeScript core、Tauri 和 SQLite 稳定之后。AI、手机端、手表端、云同步都是长期能力，不应反过来影响 v0.2 的数据底座稳定。

### 1. AI 结构化解析

目标：

- 用 AI 解析复杂目标、训练反馈和饮食记录。
- 输出固定 JSON。
- 校验后进入规则引擎。

边界：

- AI 只能生成结构化候选。
- AI 不能静默修改训练计划。
- 修改计划必须经过 schema 校验、规则引擎处理和用户确认。
- 断网时保留本地规则降级。

### 2. 手机端

目标：

- 更适合训练现场快速记录。

前置条件：

- TypeScript core 稳定。
- Tauri / SQLite 版本的数据模型和迁移路径稳定。
- 数据同步或导入导出策略清楚。

### 3. 手表端

目标：

- 采集心率、训练时长、活动量等辅助数据。

前置条件：

- `WorkoutSession` 模型足够清楚。
- 外部数据来源和权限边界明确。
- 手机端或桌面端已有稳定的数据接入策略。

### 4. 云同步

目标：

- 多设备数据同步和备份。

前置条件：

- TypeScript core、Tauri 和 SQLite 版本稳定。
- 账号、加密、冲突合并和隐私策略成熟。
- 本地优先的数据模型稳定。

## 正式重构的建议第一步

第一步不要先改 UI，也不要先上框架。Phase 2 的核心规则拆分已经收口：`goal-parser`、`plan-generator`、`metric-analyzer`、`advice-engine`、`exercise-feedback-analyzer`、`nutrition-parser`、`integrated-signals`、`weekly-review` 都已拆出，并通过 `window.FitnessCore.Rules` 汇总；`window.FitnessPlanner` 仅作为旧入口兼容别名。Phase 3 数据底座、Phase 4 TypeScript core、Phase 5 Tauri 壳和 Phase 6 SQLite 存储桥接已经落地。下一步应继续收紧 core 类型、补充 SQLite 读写 smoke，并逐步把 UI / 存储职责从 `app.js` 拆出，同时保留静态 Web fallback。
