# 数据模型草案

本文档根据当前 `app.js`、`planner.js`、`data.js` 中的状态结构整理。它是重构前的数据模型草案，不要求本轮迁移代码。

## 0. AppState

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `schemaVersion` | 本地状态版本 | 已有，当前为 `2` | 保留，当前只保留 v2 状态规范化和导入保护 |
| `currentGymId` | 当前健身房 ID | 已有 | 保留 |
| `currentGoalId` | 当前目标 ID | 已有 | 保留 |
| `gyms` | 健身房列表 | 已有 | 保留 |
| `exercises` | 动作库，启动时与静态动作库合并 | 已有 | 后续拆静态主数据和用户自定义动作 |
| `goals` | 目标列表 | 已有 | 保留 |
| `metrics` | 身体指标记录 | 已有 | 保留 |
| `plan` | 当前训练计划 | 已有，单份 | 后续支持计划历史 |
| `sessions` | 训练整体反馈记录 | 已有 | 扩展为清晰的 `WorkoutSession` |
| `exerciseLogs` | 动作级反馈记录 | 已有 | 增加 `sessionId` 和可选 `sets` |
| `nutritionLogs` | 饮食记录 | 已有 | 保留 |
| `feedback` | 旧训练反馈兼容数组 | 已有 | 建议逐步并入 `sessions` |
| `advice` | 智能建议 | 已有 | 增加统一状态 |
| `revisions` | 计划调整记录 | 已有 | 增加 patch schema |

## 1. Goal

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 目标 ID | 已有 | 保留 |
| `createdAt` | 创建时间展示文本 | 已有 | 后续增加 ISO 时间 |
| `rawText` | 用户输入的自然语言目标 | 已有 | 保留 |
| `parsed` | 解析后的结构化目标 | 已有 | 保留并固定 schema |

### `Goal.parsed` 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `rawText` | 原始文本 | 已有 | 可与外层 `rawText` 去重或明确冗余用途 |
| `primaryGoal` | 主目标：`fat_loss`、`muscle_gain`、`strength`、`maintenance`、`general_fitness` | 已有 | 保留枚举 |
| `primaryGoalLabel` | 主目标中文名 | 已有 | 可由枚举派生，减少存储冗余 |
| `secondaryGoal` | 次目标 | 已有 | 保留 |
| `secondaryGoalLabel` | 次目标中文名 | 已有 | 可由枚举派生 |
| `targetWeight` | 目标体重 | 已有 | 增加单位说明，默认 kg |
| `trainingDaysPerWeek` | 每周训练天数 | 已有 | 保留 |
| `sessionDurationMinutes` | 单次训练时长 | 已有 | 保留 |
| `frequentTravel` | 是否经常出差 | 已有 | 可由 constraints 派生，但保留也可接受 |
| `conveniencePriority` | 是否强调便利 / 低录入成本 | 已有 | 保留 |
| `constraints` | 约束标签 | 已有 | 固定枚举 |
| `notes` | 解析备注 | 已有 | 保留 |

### 关系

- `Goal` 被 `TrainingPlan.context`、`NutritionLog.analysis`、`WeeklyReview` 和联动建议读取。
- `AppState.currentGoalId` 指向当前目标。

## 2. Gym

### 字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 健身房 ID | 已有 | 保留 |
| `name` | 健身房名称 | 已有 | 保留 |
| `location` | 地点或备注 | 已有 | 保留，字段名可考虑改为 `note` 或拆分 |
| `equipment` | 可用器械 ID 列表 | 已有 | 保留 |

### 关系

- `AppState.currentGymId` 指向当前健身房。
- `TrainingPlan.context.gymName` 保存生成时健身房名称。
- `WorkoutSession.gymId`、`gymName` 保存训练时场地快照。
- `planner.isAvailable` 用 `Gym.equipment` 判断动作可用性。

## 3. Equipment

### 字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 器械 ID | 已有 | 保留 |
| `label` | 器械中文名 | 已有 | 保留 |
| `englishLabel` | 英文名 | 部分由 `app.js` 映射函数提供 | 建议沉入模型或独立字典 |
| `family` | 器械家族 / 类型 | 由 `app.js` 推断 | 可选，后续用于筛选和图标 |
| `iconType` | 图标类型 | 由 `app.js` 推断 | 可选 |

### 关系

- `Gym.equipment` 引用 `Equipment.id`。
- `Exercise.equipment` 引用 `Equipment.id`。
- UI 器械图例和动作可用性依赖该模型。

## 4. Exercise

### 字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 动作 ID | 已有 | 保留 |
| `name` | 中文动作名 | 已有 | 保留 |
| `englishName` | 英文动作名 | 当前由 `app.js` 映射函数提供 | 建议沉入模型或独立字典 |
| `pattern` | 动作模式 | 已有 | 保留并固定枚举方向 |
| `muscles` | 目标肌群列表 | 已有 | 保留 |
| `equipment` | 所需器械 ID 列表 | 已有 | 保留 |
| `substitutes` | 替代动作 ID 列表 | 已有 | 保留 |
| `cue` | 技术提示 | 已有 | 保留 |
| `risk` | 风险提示 | 已有 | 保留 |
| `links` | 示例链接 | 已有 | 保留 |
| `media` | 图片 / 视频资源 | 当前由 `app.js` 推断 | 后续可选 |
| `isCustom` | 是否用户自定义 | CSV 导入隐式产生但无字段 | 建议新增 |

### 关系

- `PlannedExercise.exerciseId` 引用 `Exercise.id`。
- `ExerciseLog.exerciseId` 引用 `Exercise.id`。
- 替代动作关系由 `Exercise.substitutes` 和相同 `pattern` 推导。

## 5. TrainingPlan

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 计划 ID | 已有 | 保留 |
| `generatedAt` | 生成时间展示文本 | 已有 | 后续增加 ISO 时间 |
| `context` | 计划生成上下文 | 已有 | 固定 schema |
| `days` | 训练日列表 | 已有 | 保留 |

### `context` 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `goalLabel` | 生成时目标标签 | 已有 | 保留 |
| `gymName` | 生成时健身房名称 | 已有 | 保留 |
| `equipment` | 生成时器械 ID 快照 | 已有 | 保留 |
| `metricSummary` | 生成时指标摘要 | 已有 | 可改为结构化快照 |
| `notes` | 生成备注 | 已有 | 保留 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `schemaVersion` | 计划对象版本 |
| `goalId` | 生成时目标 ID |
| `gymId` | 生成时场地 ID |
| `startDate` | 计划开始日期 |
| `status` | `active`、`archived` |

### 关系

- `AppState.plan` 当前只保存一份当前计划。
- `WorkoutSession.planId` 引用计划。
- `Revision.patch` 修改当前计划。

## 6. WorkoutDay

### 字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `type` | 训练日类型，如 `upper`、`lower`、`conditioning` | 已有 | 保留 |
| `focus` | 训练日名称 | 已有 | 保留 |
| `intent` | 训练日意图说明 | 已有 | 保留 |
| `exercises` | 计划动作列表 | 已有 | 保留 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `id` | 训练日稳定 ID |
| `planId` | 所属计划 ID |
| `dayIndex` | 展示顺序 |
| `scheduledDate` | 可选计划日期 |

### 关系

- `TrainingPlan.days` 包含多个 `WorkoutDay`。
- `WorkoutSession.dayIndex` 当前用数组下标引用训练日，后续建议改为 `workoutDayId`。

## 7. PlannedExercise

### 字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `exerciseId` | 动作 ID | 已有 | 保留 |
| `sets` | 计划组数 | 已有 | 建议数字化 |
| `reps` | 计划次数或时长 | 已有，字符串 | 保留展示字段，另增结构化字段 |
| `load` | 计划重量 / 强度 | 已有，字符串 | 后续拆 `targetLoad` 和单位 |
| `rpe` | 计划 RPE | 已有，字符串 | 后续可结构化为范围 |
| `rest` | 休息时间 | 已有，字符串 | 后续可结构化为秒 |
| `notes` | 备注 | 已有 | 保留 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `id` | 计划动作稳定 ID |
| `workoutDayId` | 所属训练日 ID |
| `order` | 顺序 |
| `targetRepMin` / `targetRepMax` | 结构化 reps 范围 |
| `targetRpeMin` / `targetRpeMax` | 结构化 RPE 范围 |
| `sourceExerciseId` | 替换前原动作 ID |

### 关系

- `ExerciseLog.planned*` 当前保存计划动作快照。
- `Revision.patch` 通过 `dayIndex`、`rowIndex` 定位该对象，后续应改为 ID。

## 8. WorkoutSession

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | session ID | 已有 |
| `date` | 训练日期 | 已有 |
| `createdAt` | 创建时间展示文本 | 已有 |
| `gymId` | 场地 ID | 已有 |
| `gymName` | 场地名称快照 | 已有 |
| `planId` | 计划 ID | 已有 |
| `dayIndex` | 训练日下标 | 已有 | 建议改为 `workoutDayId` + 保留兼容 |
| `focus` | 训练日名称快照 | 已有 |
| `completion` | 完成度百分比 | 已有 |
| `rpe` | 平均 RPE | 已有 |
| `painScore` | 疼痛评分 | 已有 |
| `painArea` | 疼痛部位 | 已有 |
| `sleep` | 睡眠状态 1-5 | 已有 |
| `fatigue` | 疲劳程度 1-5 | 已有 |
| `notes` | 备注 | 已有 |
| `status` | `in_progress`、`completed` | 已有第一版 | 后续扩展 `planned`、`skipped` |
| `startedAt` | 开始时间展示文本 | 已有第一版 | 后续改 ISO 时间 |
| `completedAt` | 完成时间展示文本 | 已有第一版 | 后续改 ISO 时间 |
| `exerciseLogIds` | 动作日志 ID 列表 | 已有第一版 | 后续可由反向查询替代或校验 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `endedAt` | 结束时间，建议与 `completedAt` 统一命名 |
| `durationMinutes` | 实际训练时长 |
| `goalId` | 当时目标 ID |
| `workoutDayId` | 训练日 ID |

### 关系

- 一次 `WorkoutSession` 对应多个 `ExerciseLog`。
- 周复盘和联动建议读取 `WorkoutSession`。

## 9. ExerciseLog

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 动作日志 ID | 已有 | 保留 |
| `date` | 日期 | 已有 | 保留 |
| `createdAt` | 创建时间展示文本 | 已有 | 后续增加 ISO 时间 |
| `exerciseId` | 动作 ID | 已有 | 保留 |
| `exerciseName` | 动作名称快照 | 已有 | 保留 |
| `dayIndex` | 训练日下标 | 已有 | 改为 session / day ID |
| `focus` | 训练日名称快照 | 已有 | 保留 |
| `plannedSets` | 计划组数快照 | 已有 | 保留兼容 |
| `plannedReps` | 计划次数快照 | 已有 | 保留兼容 |
| `plannedLoad` | 计划负重快照 | 已有 | 保留兼容 |
| `plannedRpe` | 计划 RPE 快照 | 已有 | 保留兼容 |
| `actualLoad` | 实际重量文本 | 已有 | 后续结构化 |
| `actualReps` | 实际次数文本 | 已有 | 后续结构化 |
| `rpe` | 动作整体 RPE | 已有 | 保留 |
| `quality` | 动作质量：`good`、`ok`、`poor` | 已有 | 保留枚举 |
| `rangeOfMotion` | 幅度：`full`、`reduced_late`、`partial` | 已有 | 保留枚举 |
| `targetMuscleFeel` | 目标肌肉感觉 | 已有 | 保留枚举 |
| `limitingFactor` | 主要限制因素 | 已有 | 保留枚举 |
| `sideIssue` | 左右差异 | 已有 | 保留枚举 |
| `painScore` | 疼痛评分 | 已有 | 保留 |
| `painArea` | 疼痛部位 | 已有 | 保留 |
| `freeText` | 自由文本反馈 | 已有 | 保留 |
| `analysis` | 规则分析结果 | 已有 | 保留，但建议可重算 |
| `sessionId` | 所属 `WorkoutSession` | 已有第一版 | 当前 schema 下允许为空 |
| `sets` | `SetLog[]` | 已有第一版 | 可选，不强制填写 |
| `volumeLoad` | 容量统计 | 已有第一版 | 衍生字段，建议可重算 |
| `hardSets` | 有效组数 | 已有第一版 | 当前按 RPE >= 7 粗略判断 |
| `simplePr` | 简单 PR 判断结果 | 已有第一版 | 当前判断容量、最大重量、最大次数 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `plannedExerciseId` | 对应计划动作 |
| `completedSets` | 完成组数 |

### 关系

- `ExerciseLog` 属于一个 `WorkoutSession`。
- `ExerciseLog` 可包含多个 `SetLog`。
- `ExerciseLog.analysis` 由 `planner.analyzeExerciseFeedback` 生成。

## 10. SetLog

当前已有 `SetLog` 第一版。它作为 `ExerciseLog.sets` 内的可选数组存在，不强制所有动作记录都填写；如果用户不填每组记录，系统会尽量从 `actualLoad` 和 `actualReps` 推导。

### 建议字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 组记录 ID | 没有 | 新增 |
| `sessionId` | 所属训练 session | 没有 | 当前通过 `ExerciseLog.sessionId` 间接关联 |
| `exerciseLogId` | 所属动作日志 | 没有 | 当前由父级数组隐含 |
| `plannedExerciseId` | 对应计划动作 | 没有 | 可选 |
| `setIndex` | 第几组，从 1 开始 | 已有第一版 | 保留 |
| `plannedReps` | 计划次数 | 没有 | 可选 |
| `actualReps` | 实际次数 | 已有第一版，字段名为 `reps` | 后续可统一命名 |
| `load` | 实际重量数值 | 已有第一版，字段名为 `loadKg` | 当前默认 kg |
| `loadUnit` | 重量单位，默认 kg | 没有 | 当前隐含为 kg |
| `rpe` | 本组 RPE | 已有第一版 | 可选 |
| `completed` | 是否完成 | 已有第一版 | 保留 |
| `isWarmup` | 是否热身组 | 没有 | 可选 |
| `notes` | 备注 | 已有第一版，字段名为 `note` | 后续可统一命名 |

### 关系

- 多个 `SetLog` 属于一个 `ExerciseLog`。
- `WorkoutSession` 可通过 `ExerciseLog` 汇总训练容量和有效组数。

## 11. BodyMetricEntry

### 字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 指标记录 ID | 已有 | 保留 |
| `date` | 日期 | 已有 | 保留 |
| `weight` | 体重 kg | 已有 | 保留 |
| `bodyFat` | 体脂率 % | 已有 | 保留 |
| `skeletalMuscle` | 骨骼肌 kg | 已有 | 保留 |
| `waist` | 腰围 cm | 已有 | 保留 |
| `notes` | 备注 | 已有 | 保留 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `createdAt` | 创建时间 |
| `source` | 手动录入、导入等 |

### 关系

- `metricTrend` 读取该模型。
- 计划生成、联动建议和周复盘读取指标趋势。

## 12. NutritionLog

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 饮食记录 ID | 已有 | 保留 |
| `date` | 日期 | 已有 | 保留 |
| `createdAt` | 创建时间展示文本 | 已有 | 后续增加 ISO 时间 |
| `rawText` | 自然语言饮食文本 | 已有 | 保留 |
| `goalId` | 当时目标 ID | 已有 | 保留 |
| `analysis` | 饮食解析和建议结果 | 已有 | 保留，但建议可重算 |

### `analysis` 当前主要字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `rawText` | 原始文本 | 已有 | 可与外层去重 |
| `meals` | 餐次解析结果 | 已有 | 保留 |
| `items` | 食物项平铺列表 | 已有 | 保留 |
| `tags` | 饮食标签 | 已有 | 固定枚举 |
| `estimates.total` | 总营养估算 | 已有 | 保留粗略估算定位 |
| `estimates.target` | 目标建议范围 | 已有 | 保留 |
| `estimates.dayStatus` | 当日目标匹配状态 | 已有 | 保留 |
| `priority` | 建议优先级 | 已有 | 保留 |
| `priorityLabel` | 优先级中文名 | 已有 | 可派生 |
| `evidence` | 依据 | 已有 | 保留 |
| `recommendationItems` | 结构化建议项 | 已有 | 保留 |
| `recommendations` | 建议文本列表 | 已有 | 可由 recommendationItems 派生 |
| `confidence` | 解析置信度 | 已有 | 保留 |
| `missingInfo` | 建议补充的信息 | 已有 | 保留 |

### 关系

- `NutritionLog` 产生 `Advice`。
- 饮食画像、饮食趋势、首页联动、周复盘读取 `NutritionLog.analysis`。

## 13. Advice

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 建议 ID | 已有 | 保留 |
| `createdAt` | 创建时间展示文本 | 已有 | 后续增加 ISO 时间 |
| `title` | 标题 | 已有 | 保留 |
| `body` | 正文 | 已有 | 保留 |
| `tags` | 标签 | 已有 | 固定枚举或至少文档化 |
| `priority` | 优先级 | 部分建议已有 | 建议统一必填 |
| `priorityLabel` | 优先级中文名 | 部分建议已有 | 可派生 |
| `evidence` | 依据列表 | 部分建议已有 | 建议统一 |
| `recommendationItems` | 结构化建议项 | 部分建议已有 | 建议统一 |
| `status` | 状态 | 局部展示读取，但大多没有 | 建议新增 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `sourceType` | `plan`、`session`、`exercise_log`、`nutrition`、`weekly_review` |
| `sourceId` | 来源对象 ID |
| `status` | `new`、`read`、`dismissed`、`acted`、`expired` |
| `expiresAt` | 过期时间，可选 |

### 关系

- 训练计划生成、训练反馈、动作反馈、饮食记录和周复盘都会产生建议。
- 智能教练页展示 `Advice`。

## 14. Revision

### 当前字段

| 字段 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `id` | 调整记录 ID | 已有 | 保留 |
| `createdAt` | 创建时间展示文本 | 已有 | 后续增加 ISO 时间 |
| `status` | `pending` 或 `applied` | 已有 | 保留并扩展 |
| `summary` | 调整摘要 | 已有 | 保留 |
| `reason` | 调整原因 | 已有 | 保留 |
| `tags` | 标签 | 已有 | 保留 |
| `patch` | 修改计划的结构化补丁 | 已有 | 需要 schema |
| `appliedAt` | 应用时间 | 已有，应用后写入 | 保留 |

### 当前 patch 类型

| 类型 | 含义 | 当前是否已有 | 建议调整 |
| --- | --- | --- | --- |
| `reduce_day_volume` | 降低某训练日组数 | 已有 | 改为用 ID 定位 |
| `trim_accessory` | 删除部分辅助动作 | 已有 | 改为用 ID 定位 |
| `add_progression_note` | 给主动作增加进阶备注 | 已有 | 改为用 ID 定位 |
| `manual_replace` | 手动替换动作 | 已有 | 保留 |
| `increase_cardio_time` | 增加有氧时长 | 已有，后半段 `applyRevision` 支持 | 保留 |

### 建议新增字段

| 字段 | 含义 |
| --- | --- |
| `sourceType` | `session_feedback`、`weekly_review`、`manual` |
| `sourceId` | 来源 ID |
| `requiresConfirmation` | 是否需要用户确认 |
| `beforeSnapshot` | 应用前局部快照，可选 |
| `afterSnapshot` | 应用后局部快照，可选 |

### 关系

- `Revision` 修改 `TrainingPlan`。
- 必须保持“用户确认后应用”的边界。

## 15. 当前模型的主要风险

1. `WorkoutSession` 与 `ExerciseLog` 没有稳定关联，后续做训练容量和周复盘时会受限。
2. `WorkoutDay` 和 `PlannedExercise` 缺少稳定 ID，当前用数组下标定位，计划调整后历史上下文容易漂移。
3. `schemaVersion` 已升级到 `2`；一次性 v1 到 v2 迁移代码已移除，后续新增字段时再按需要增加迁移记录和 smoke 用例。
4. `Advice` 来源和状态不统一，未来会越来越难管理建议去重、过期和执行状态。
5. `NutritionLog.analysis` 和 `ExerciseLog.analysis` 存储了可由规则重算的内容，后续需要决定是保存快照还是重算。
