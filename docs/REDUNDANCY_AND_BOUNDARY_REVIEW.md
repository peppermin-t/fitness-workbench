# 冗余与边界审查

本文档检查当前代码中功能冗余、模块边界混乱和未来容易膨胀的部分。结论基于当前代码现状，不涉及本轮重构执行。

## 1. “今日训练”“训练计划”“智能教练”的边界

### 当前边界

- “训练计划”页负责生成、展示、CSV 导入 / 导出完整计划。
- “今日训练”页负责选择当前训练日、查看当天可执行动作、记录训练反馈和动作反馈。
- “智能教练”页负责集中展示建议、周复盘、计划调整记录、动作画像、饮食画像和动作历史。

### 边界不清处

- 今日训练页也可以生成 / 刷新计划，训练计划页也可以生成计划，入口重复但还能接受。
- 今日训练页展示建议，智能教练页也展示建议；“今日建议”“训练前提醒”“智能建议”三者口径接近。
- 智能教练页不仅展示建议，还可以应用 revision 修改计划；这让它同时承担“分析中心”和“计划修改入口”。
- 周复盘候选在智能教练页中可直接应用到计划，但实际修改逻辑在 `app.js`，与计划页边界交叉。

### 建议边界

- 训练计划：负责计划生成、计划查看、计划导入导出和手动动作替换。
- 今日训练：负责当天执行和记录，不负责长期分析。
- 智能教练：负责建议、复盘和候选调整，但所有调整必须显式确认。
- 后续可把“建议来源”统一成 `Advice`，今日页只展示过滤后的今日相关建议。

## 2. 饮食记录变成完整营养 App 的风险

### 当前定位

当前饮食模块是训练辅助工具：

- 自然语言快速记录。
- 粗略餐次拆分。
- 小型食物库估算。
- 标签化判断蛋白、漏餐、外食、高油、高糖、高钠、纤维等结构问题。
- 输出训练相关建议。

### 膨胀风险

- `planner.js` 中已经内置 `FOOD_LIBRARY`、营养估算、目标范围、趋势、画像和建议规则。
- 如果继续增加更多食物、品牌、单位、营养素，很容易演变成完整营养数据库。
- 一旦加入精确热量、扫码、微量营养素，会偏离“低录入成本训练工作台”的目标。

### 建议边界

- v0.2 只保留“结构判断 + 粗略估算”。
- 不做完整食物库。
- 不做扫码。
- 不做微量营养素。
- 不做医学营养处方。
- 食物库应拆出为独立静态字典，但定位仍是辅助规则，不是主产品。

## 3. 动作库是展示还是编辑能力

### 当前状态

- 动作库主要是展示和搜索。
- 静态动作数据在 `data.js`。
- CSV 导入找不到动作时，`app.js` 会通过 `findOrCreateExercise` 创建极简动作。
- 没有正式编辑动作的 UI。

### 边界问题

- README 提到后续“更完整的动作库编辑能力”，但当前代码只支持隐式创建。
- 动作展示、英文名映射、器械图标、动作媒体推断都在 `app.js`，导致动作库不仅是数据，还混入 UI 展示规则。
- 替代动作关系既来自 `substitutes`，也来自相同 `pattern` 推导。

### 建议边界

- v0.2 动作库定位为“可查看 + 可被计划生成使用 + CSV 导入时可补充极简动作”。
- 完整动作编辑器暂不做。
- 后续模型中增加 `isCustom`，把用户自定义动作和内置动作区分开。
- 动作媒体、英文名、器械展示应从 `app.js` 中逐步拆到数据或 presenter 层。

## 4. 智能建议是否分散在多个页面

### 当前分散点

- 计划生成会写入一条 `advice`。
- 训练整体反馈会通过 `window.FitnessCore.Rules.createAdviceFromSession` 写入 `advice` 和 `revisions`；`window.FitnessPlanner.createAdviceFromSession` 仅作为旧入口兼容。
- 动作级反馈在 `app.js` 中直接构造 `advice`。
- 饮食记录在 `app.js` 中直接构造 `advice`。
- 今日页通过 `planner.buildLinkedTodayInsights` 和 `buildTrainingReminders` 展示即时建议。
- 饮食页通过 `buildNutritionReminders` 展示饮食前提醒。
- 智能教练页集中展示 `state.advice`。

### 风险

- 建议生成逻辑分散在 `app.js` 和 `planner.js`，后续难以统一排序、去重和状态。
- 同一问题可能以今日建议、饮食提醒、智能教练建议多次出现。
- `Advice` 结构不完全统一，有些有 `priority`、`evidence`、`recommendationItems`，有些没有。

### 建议边界

- 统一 `Advice` 模型。
- 统一 `RecommendationItem` 结构。
- `app.js` 不直接拼业务建议，只调用 advice engine。
- 今日页、饮食页、智能教练页只负责按场景过滤和展示。

## 5. `app.js` 是否承担过多职责

### 当前职责

`app.js` 当前同时承担：

- DOM 查询和事件绑定。
- 路由 / view 切换。
- 默认状态、读取 localStorage、保存 localStorage。
- 表单数据收集和状态写入。
- HTML 字符串渲染。
- 训练计划生成协调。
- 训练反馈、动作反馈、饮食记录保存。
- 建议和 revision 写入。
- CSV 导入 / 导出。
- JSON 导入 / 导出。
- canvas 图表绘制。
- 器械图标 SVG。
- 肌肉图 SVG。
- 动作媒体 / 英文名 / 器械英文名映射。
- 周复盘候选应用。

### 明确问题

- 文件仍然过大，当前承担 UI 渲染、事件处理、状态协调和展示映射。
- Phase 3 / Phase 5 之间已经清理过旧同名函数覆盖问题；当前脚本检查未发现 `app.js` 中仍存在同名函数重复定义。
- `app.js` 仍然既是 UI 层又是应用服务层，还包含一部分展示数据字典。
- `planner.js` 当前已收窄为旧入口兼容别名；`src/core/rules/*.js` 是 `index.html` 直接运行所需的兼容输出，不应作为“无用冗余”删除。

### 建议拆分方向

- `app/state`：状态读写和业务操作。
- `app/storage`：localStorage、JSON、迁移。
- `app/render`：页面渲染。
- `app/charts`：canvas 图表。
- `app/import-export`：CSV 和 JSON。
- `app/presenters`：标签、展示文案、英文名、图标映射。

## 6. `planner.js` 是否已经过大

### 当前职责

`planner.js` 当前主要承担：

- `window.FitnessPlanner` 旧入口兼容别名。
- 指向 `window.FitnessCore.Rules`，不再保留业务规则实现。

规则聚合已经前移到 `src/core/rules/facade.js`。

### 应拆分的函数组

- `goal-parser`：`parseGoal`
- `plan-generator`：`generatePlan`、`buildPlanDay`、`planDayTypes`、`planConfig`、`pickAvailableExercise`
- `exercise-feedback-analyzer`：`analyzeExerciseFeedback`、`buildExerciseProfiles`
- `nutrition-parser`：`parseNutritionLog`、`splitMeals`、`extractFoodItems`、`FOOD_LIBRARY`
- `metric-analyzer`：`sortedMetrics`、`metricTrend`
- `integrated-signals`：`buildIntegratedSignals`
- `weekly-review`：`buildWeeklyReview`
- `advice-engine`：`recommendationItem`、`buildAdviceEntry`、优先级排序函数

### 风险

- `planner.js` 不再是 `app.js` 的规则入口，但仍是 smoke 测试和旧调用方的兼容 API，不能在确认所有外部入口迁移前删除。
- `createAdviceFromSession` 已并入 `src/core/rules/advice-engine.js`。
- 规则 `.ts` 文件仍保留过渡性的 `// @ts-nocheck`，类型债需要逐模块偿还。

## 7. `data.js` 是否混合静态主数据和业务语义

### 当前内容

- 器械字典。
- 动作字典。
- 动作替代关系。
- 技术提示。
- 风险提示。
- 示例链接。
- 默认健身房模板。

### 混合点

- 器械和动作是静态主数据。
- 替代关系属于训练业务规则的一部分。
- 风险提示和技术提示属于内容知识。
- 示例链接属于展示 / 内容资源。
- 默认健身房模板属于初始化 seed data。

### 建议边界

- `equipment-data`：器械主数据。
- `exercise-data`：动作主数据。
- `exercise-substitutions`：替代关系。
- `seed-gyms`：默认场地。
- 后续如果做用户自定义动作，应明确内置数据和用户数据的合并策略。

## 8. 重复渲染、重复规则或字段命名不一致

### 重复渲染

Phase 5 清理后，`app.js` 当前未发现同名函数重复定义。此前遗留的旧 `renderExerciseLogSelect` 和旧 `saveNutritionLog` 已删除，保留的是当前实际行为版本。

后续仍应继续控制新增重复：

- 新增 UI 入口前先检查是否已有渲染函数。
- 不在 `app.js` 中继续堆叠同名覆盖式实现。
- 每次清理后运行 `npm.cmd run verify:desktop`。

### 重复规则

- 今日建议、训练前提醒、饮食前提醒、智能教练建议都在生成类似建议。
- 饮食画像、联动信号和周复盘都会基于 `nutritionLogs` 产生相似结论。
- 训练整体反馈和周复盘都会产生 `Revision`。

已通过 `src/core/rules/advice-engine.js` 初步统一 advice helper 和 `revision` 结构。后续还需要把 `app.js` 中直接拼装建议的入口继续收口到 advice engine。

### 字段命名不一致

- `metrics` 中使用 `bodyFat`、`skeletalMuscle`，UI 中文是体脂、骨骼肌。
- `ExerciseLog` 中是 `rangeOfMotion`，UI 文案是“动作幅度”。
- `ExerciseLog` 中是 `targetMuscleFeel`，规则标签是 `poor_target_muscle_feel`。
- `WorkoutSession` 中 `rpe` 表示平均 RPE，`ExerciseLog.rpe` 表示动作整体 RPE，未来 `SetLog.rpe` 表示每组 RPE，需要文档明确。
- `feedback` 和 `sessions` 概念重叠。
- `plan.days[].exercises[]` 实际是计划动作，但没有 `PlannedExercise` 名称和 ID。

### 建议命名原则

- 模型字段保持英文稳定。
- UI 文案通过 presenter 映射，不直接混入业务判断。
- 所有 RPE 字段都加上下文：`sessionRpe`、`exerciseRpe`、`setRpe` 可在类型层明确。
- 旧字段保留兼容，但新增模型使用更清楚命名。

## 9. 当前最容易膨胀的三个点

1. 饮食模块：容易从训练辅助变成完整营养 App。
2. 智能教练：容易承载所有分析、计划修改、建议展示和历史记录。
3. `app.js`：容易继续堆 UI、状态、存储、图表和业务协调。

## 10. 当前最需要收口的三个边界

1. `WorkoutSession`、`ExerciseLog`、`SetLog` 的层级关系。
2. `Advice`、`Revision`、`WeeklyReview` 的建议和计划修改边界。
3. `data.js` 静态主数据和 `planner.js` 业务规则之间的边界。
