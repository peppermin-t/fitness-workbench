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
- 周复盘候选在智能教练页中可直接应用到计划，实际修改逻辑已收敛到 `src/app/state/workbench-actions.ts`，但入口仍在智能教练页，与计划页边界交叉。

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

- `src/core/rules/nutrition-parser.ts` 中已经内置 `FOOD_LIBRARY`、营养估算、目标范围、趋势、画像和建议规则。
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
- 静态动作数据在 `src/core/data/fitness-data.ts`。
- CSV 导入找不到动作时，`src/app/main.ts` 会通过兼容包装调用 `src/app/state/workbench-actions.ts` 创建极简动作。
- 没有正式编辑动作的 UI。

### 边界问题

- README 提到后续“更完整的动作库编辑能力”，但当前代码只支持隐式创建。
- 动作展示模板已收敛到 `src/app/render/view-renderers.ts`，英文名、器械展示文案和器械分类文案已收敛到 `src/app/presenters/display-formatters.ts`。此前未实际展示的器械图标 SVG、肌肉图 SVG 和动作媒体样式已移除。
- 替代动作关系既来自 `substitutes`，也来自相同 `pattern` 推导。

### 建议边界

- v0.2 动作库定位为“可查看 + 可被计划生成使用 + CSV 导入时可补充极简动作”。
- 完整动作编辑器暂不做。
- 后续模型中增加 `isCustom`，把用户自定义动作和内置动作区分开。
- 英文名和器械展示文案已先拆到 presenter 层；后续如果要进一步完善，可再考虑移动到更稳定的数据字典。未实际展示的媒体 / 图标代码不再保留。

## 4. 智能建议是否分散在多个页面

### 当前分散点

- 计划生成会写入一条 `advice`。
- 训练整体反馈会通过 `window.FitnessCore.Rules.createAdviceFromSession` 写入 `advice` 和 `revisions`；`window.FitnessCore.Rules.createAdviceFromSession` 仅作为统一规则入口。
- 动作级反馈通过 `src/app/state/workbench-actions.ts` 构造并写入 `advice`。
- 饮食记录通过 `src/app/state/workbench-actions.ts` 构造并写入 `advice`。
- 今日页通过 `planner.buildLinkedTodayInsights` 和 `buildTrainingReminders` 展示即时建议。
- 饮食页通过 `buildNutritionReminders` 展示饮食前提醒。
- 智能教练页集中展示 `state.advice`。

### 风险

- 建议生成逻辑分散在 core 规则和 `src/app/state/workbench-actions.ts`，后续仍需要统一 advice 生命周期、排序、去重和状态。
- 同一问题可能以今日建议、饮食提醒、智能教练建议多次出现。
- `Advice` 结构不完全统一，有些有 `priority`、`evidence`、`recommendationItems`，有些没有。

### 建议边界

- 统一 `Advice` 模型。
- 统一 `RecommendationItem` 结构。
- `src/app/main.ts` 不直接拼业务建议，只调用 advice engine。
- 今日页、饮食页、智能教练页只负责按场景过滤和展示。

## 5. `src/app/main.ts` 是否承担过多职责

### 当前职责

`src/app/main.ts` 当前同时承担：

- DOM 查询和事件绑定。
- 路由 / view 切换。
- 状态协调调用；默认状态、读取 localStorage、保存 localStorage 已收敛到 `src/app/storage/app-state-store.ts`。
- 表单数据收集；目标、场地、指标、计划、训练反馈、动作日志、饮食记录、revision 应用等主要状态写入已收敛到 `src/app/state/workbench-actions.ts`。
- HTML 字符串渲染调度；状态栏、目标、指标、计划、器械、场地列表、今日建议、饮食列表、动作历史、智能教练和周复盘等模板已收敛到 `src/app/render/view-renderers.ts`。
- 训练计划生成的 UI 协调；实际状态写入已收敛到 `src/app/state/workbench-actions.ts`。
- 训练反馈、动作反馈、饮食记录保存的 UI 协调。
- 建议和 revision 写入的 UI 协调；第一批写入逻辑已收敛到 `src/app/state/workbench-actions.ts`。
- CSV 导入 / 导出的 UI 事件和状态写入；CSV 构造 / 解析 helper 已收敛到 `src/app/import-export/data-portability.ts`，浏览器下载 / 文件读取已收敛到 `src/app/io/browser-file-io.ts`。
- JSON 导入 / 导出的 UI 事件和状态写入；JSON 序列化 / 解析 helper 已收敛到 `src/app/import-export/data-portability.ts`，浏览器下载 / 文件读取和恢复确认已收敛到 `src/app/io/browser-file-io.ts`。
- canvas 图表入口和数据选择；通用折线图绘制 helper 已收敛到 `src/app/charts/line-chart.ts`。
- 展示格式化调用；英文名 / 器械英文名 / 器械分类映射已收敛到 `src/app/presenters/display-formatters.ts`。
- 器械图标 SVG、肌肉图 SVG 和动作媒体样式已移除，不再作为当前功能保留。
- 周复盘候选应用。

### 明确问题

- 文件仍然过大，当前承担复杂 UI 渲染、事件处理、状态协调和展示格式化调用。
- Phase 3 / Phase 5 之间已经清理过旧同名函数覆盖问题；当前脚本检查未发现 `src/app/main.ts` 中仍存在同名函数重复定义。
- `src/app/main.ts` 仍然既是 UI 层又是应用服务层；状态存储 helper、导入导出 helper、浏览器文件 I/O helper、通用图表 helper、展示格式化 helper、视图模板 helper 和主要业务状态动作已拆出。当前剩余问题主要是 DOM 事件、表单读取、保存后刷新和 toast 协调仍集中在一个文件内。
- `src/core/rules/facade.ts` 是当前正式规则聚合入口；`src/core/rules/*.ts` 是 Tauri 前端当前实际加载输出的源码，不应作为“无用冗余”删除。

### 建议拆分方向

- `app/state`：业务状态操作。已开始：`workbench-actions` 承担目标、场地、指标、计划、训练反馈、计划调整、动作日志、饮食日志和 revision 应用。
- `app/storage`：localStorage、JSON、迁移。已开始：`app-state-store` 承担默认状态、本地读写和桌面 SQLite hydration。
- `app/render`：页面渲染。`view-renderers` 已承担状态栏、目标、指标、计划、器械、场地列表、今日建议、饮食列表、动作历史、智能教练和周复盘等主要模板。
- `app/io`：浏览器文件 I/O。`browser-file-io` 已承担下载、FileReader 读取和恢复确认。
- `app/charts`：canvas 图表。已开始：`line-chart` 承担身体指标和饮食趋势共用的折线图绘制。
- `app/import-export`：CSV 和 JSON。已开始：`data-portability` 承担计划 CSV 构造 / 解析、JSON 备份序列化 / 解析和下载 helper。
- `app/presenters`：标签、展示文案、英文名和器械文案映射。

## 6. 核心规则入口是否仍然过大

### 当前职责

`src/core/rules/facade.ts` 当前主要承担：

- 汇总各 `src/core/rules/*.ts` 模块为 `window.FitnessCore.Rules`。
- 不再保留业务规则实现。

旧规则兼容入口已移除，规则聚合入口保留在 `src/core/rules/facade.ts`。

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

- `src/core/rules/facade.ts` 是 `src/app/main.ts` 和 smoke 测试的规则入口，当前不能删除。
- `createAdviceFromSession` 已并入 `src/core/rules/advice-engine.ts`。
- `// @ts-nocheck` 过渡措施已移除；类型债从“遮蔽检查”转为继续补充更精确的模型和规则类型。

## 7. `src/core/data/fitness-data.ts` 是否混合静态主数据和业务语义

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

Phase 5 清理后，`src/app/main.ts` 当前未发现同名函数重复定义。此前遗留的旧 `renderExerciseLogSelect` 和旧 `saveNutritionLog` 已删除，保留的是当前实际行为版本。

后续仍应继续控制新增重复：

- 新增 UI 入口前先检查是否已有渲染函数。
- 不在 `src/app/main.ts` 中继续堆叠同名覆盖式实现。
- 每次清理后运行 `npm.cmd run verify:desktop`。

### 重复规则

- 今日建议、训练前提醒、饮食前提醒、智能教练建议都在生成类似建议。
- 饮食画像、联动信号和周复盘都会基于 `nutritionLogs` 产生相似结论。
- 训练整体反馈和周复盘都会产生 `Revision`。

已通过 `src/core/rules/advice-engine.ts` 初步统一 advice helper 和 `revision` 结构，动作 / 饮食 advice 的写入已从 `src/app/main.ts` 移到 `src/app/state/workbench-actions.ts`。后续还需要继续统一 advice 生命周期、去重和展示状态。

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
3. `src/app/main.ts`：容易继续堆 UI、状态、存储、图表和业务协调。

## 10. 当前最需要收口的三个边界

1. `WorkoutSession`、`ExerciseLog`、`SetLog` 的层级关系。
2. `Advice`、`Revision`、`WeeklyReview` 的建议和计划修改边界。
3. `src/core/data/fitness-data.ts` 静态主数据和 `src/core/rules/facade.ts` 业务规则之间的边界。
