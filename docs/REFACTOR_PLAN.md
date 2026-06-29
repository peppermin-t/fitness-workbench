# 后续重构计划

本文档只规划后续重构，不在本轮执行。重构必须保持当前运行方式：`index.html` 直接双击可用，不引入 React / Vue / Tauri / SQLite / FastAPI，不删除现有功能。

## 当前阶段状态

- Phase 0：文档、人工 smoke checklist、规则 smoke、样例 JSON 基线已具备；还差一次正式人工验收记录和可回退 git 基线。
- Phase 1：边界设计已明确，`src/core/rules` 已开始落地；`src/core/models`、`src/app/state`、`src/app/storage` 仍保持为后续设计方向，尚不引入 TypeScript 构建链。
- Phase 2：核心规则拆分已收口。`planner.js` 现在主要承担兼容导出和少量尚未单独成模块的训练整体反馈建议函数；无依赖规则 smoke 已覆盖 11 个核心用例。

## Phase 0：现状冻结

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

## Phase 1：TypeScript 化准备

状态：边界设计完成，暂不进入全面 TypeScript 化。

### 目标

先设计类型和边界，不急于全面改写。保持 UI 行为不变，仍支持 `index.html` 直接运行。

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

在真正引入构建链前，也可以先以文档和 JSDoc 形式过渡。不要为了 TypeScript 立刻破坏现有静态运行方式。

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

## Phase 2：拆分核心业务逻辑

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

状态：已完成本轮 helper 拆分；`createAdviceFromSession` 暂留 `planner.js`，后续可在拆训练整体反馈或建议流时再处理。

说明：`recommendationItem`、`buildAdviceEntry`、`sortRecommendationItems`、`highestPriority`、`priorityScore`、`priorityLabel`、`uniqueStrings` 已拆到 `src/core/rules/advice-engine.js`，并通过 `planner.js` 保持现有行为。已拆出的动作反馈、饮食、联动、周复盘等规则继续通过 `window.FitnessCore.AdviceEngine` 使用这些 helper。

来源函数：

- `createAdviceFromSession`
- `buildAdviceEntry`
- `recommendationItem`
- `sortRecommendationItems`
- `highestPriority`
- `priorityScore`
- `priorityLabel`
- `uniqueStrings`

职责：

- 统一建议结构。
- 优先级排序。
- 证据和推荐项格式。

测试重点：

- 高优先级排序。
- advice 字段完整。
- 无触发规则时输出低优先级观察建议。

### Phase 2 验收标准

- `planner.js` 已变薄，主要作为兼容导出层，并保留 `createAdviceFromSession` 这类训练整体反馈建议入口。
- 拆出的函数通过 `window.FitnessCore.*` 暴露，同时继续通过 `window.FitnessPlanner.*` 保持兼容。
- 无依赖规则 smoke 已覆盖 11 个核心用例，包括目标解析、计划生成、动作反馈、饮食解析、指标趋势、周复盘、联动建议、训练前提醒和饮食前提醒。
- `index.html` 仍按静态脚本顺序加载，不需要构建链，不改变 UI 行为。

## Phase 3：补齐 v0.2 功能缺口

### 目标

在核心边界清楚后，补齐当前最影响长期发展的数据底座。

### 1. 每组级训练记录

新增 `SetLog` 模型，并在 `ExerciseLog` 内增加可选 `sets`。

最小 UI 可以是：

- 默认仍允许快速填写 `actualLoad` 和 `actualReps`。
- 提供“展开每组记录”。
- 每组填写重量、次数、RPE、备注。

重点是不增加普通记录负担。

### 2. `WorkoutSession` 状态

将当前整体反馈扩展为更清晰的 session：

- 当前阶段可先只创建 `completed` session。
- 动作日志保存时带上 `sessionId`。
- 今日训练选择训练日时可以创建或复用当天 session。

### 3. 基础训练容量统计

在有 `SetLog` 后增加纯函数：

- `calculateVolumeLoad`
- `calculateHardSets`
- `detectSimplePr`

v0.2 可以先在智能教练或动作历史里少量展示，不做复杂报表。

### 4. 数据迁移

新增迁移路径：

- `schemaVersion: 1` 旧数据可迁移到 `schemaVersion: 2`。
- 为旧 `exerciseLogs` 补 `sessionId: null`、`sets: []`。
- 为旧计划日和计划动作补稳定 ID。
- 为旧 advice 补默认 `status`。

### 5. 规则测试

优先测试纯函数，不测试 DOM：

- 目标解析。
- 计划生成。
- 动作反馈分析。
- 饮食解析。
- 指标趋势。
- 周复盘。
- 数据迁移。

### Phase 3 验收标准

- 老 JSON 导入后不丢数据。
- 新数据能记录可选每组日志。
- 训练整体反馈和动作级反馈能通过 session 关联。
- 至少关键规则有基础测试。

## Phase 4：后续扩展

Phase 4 只做规划，不在 v0.2 实现。

### 1. Tauri

目标：

- 把静态页面封装为桌面应用。
- 提供更稳定的文件访问和备份能力。

前置条件：

- 数据模型稳定。
- localStorage 迁移机制成熟。
- JSON 备份恢复可靠。

### 2. SQLite

目标：

- 从 localStorage 升级为本地数据库。
- 支持更可靠的查询、历史计划、训练日志和迁移。

前置条件：

- schema 已稳定。
- `WorkoutSession`、`ExerciseLog`、`SetLog` 关系清楚。
- 有导入导出和迁移测试。

### 3. AI 结构化解析

目标：

- 用 AI 解析复杂目标、训练反馈和饮食记录。
- 输出固定 JSON。
- 校验后进入规则引擎。

边界：

- AI 不直接静默改计划。
- 断网时保留本地规则降级。
- AI 输出必须有 schema 校验。

### 4. 手机端

目标：

- 更适合训练现场快速记录。

前置条件：

- 当前桌面工作台功能稳定。
- 核心业务逻辑已脱离 DOM。
- 数据同步或导入导出策略清楚。

### 5. 手表端

目标：

- 采集心率、训练时长、活动量等辅助数据。

前置条件：

- `WorkoutSession` 模型足够清楚。
- 外部数据来源和权限边界明确。

### 6. 云同步

目标：

- 多设备数据同步和备份。

前置条件：

- 账号、加密、冲突合并和隐私策略成熟。
- 本地优先的数据模型稳定。

## 正式重构的建议第一步

第一步不要先改 UI，也不要先上框架。Phase 2 的核心规则拆分已经收口：`goal-parser`、`plan-generator`、`metric-analyzer`、`advice-engine`、`exercise-feedback-analyzer`、`nutrition-parser`、`integrated-signals`、`weekly-review` 都已拆出，并通过 `window.FitnessPlanner` 保持兼容。下一步先执行人工 smoke checklist 并保留可回退 git 基线；随后进入 Phase 3，优先补 `WorkoutSession`、`SetLog`、数据迁移和最小规则测试。
