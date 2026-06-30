# 核心规则测试用例

本文档用于拆分 `planner.js` 前后固定核心规则的输入输出样例。本轮只定义用例，不引入测试框架、不新增构建链、不改变 `index.html` 运行方式。

当前已有无依赖浏览器 smoke 测试：[../tests/rules-smoke.html](../tests/rules-smoke.html)。函数入口继续通过 `window.FitnessPlanner` 验证；`parseGoal` 的实际实现已拆到 `src/core/rules/goal-parser.js`，`generatePlan` / 动作可用性逻辑已拆到 `src/core/rules/plan-generator.js`，`sortedMetrics` / `metricTrend` 已拆到 `src/core/rules/metric-analyzer.js`，建议 helper 已拆到 `src/core/rules/advice-engine.js`，动作反馈分析和动作画像已拆到 `src/core/rules/exercise-feedback-analyzer.js`，饮食解析和饮食画像已拆到 `src/core/rules/nutrition-parser.js`，联动建议已拆到 `src/core/rules/integrated-signals.js`，周复盘已拆到 `src/core/rules/weekly-review.js`，但兼容 API 仍通过 `window.FitnessPlanner` 暴露。

## 1. 目标解析：减脂、保持力量、出差

### 用例名称

`parseGoal_fat_loss_strength_maintenance_travel`

### 关联函数

- `parseGoal`

### 输入数据

```text
我现在 78kg，想减脂到 72kg，不想掉力量，一周练 3 次，每次 45 分钟，最近经常出差
```

### 期望输出要点

- `primaryGoal` 为 `fat_loss`。
- `secondaryGoal` 为 `strength_maintenance`。
- `targetWeight` 为 `72`。
- `trainingDaysPerWeek` 为 `3`。
- `sessionDurationMinutes` 为 `45`。
- `frequentTravel` 为 `true`。
- `constraints` 包含 `frequent_travel`。

### 当前实现输出

截至当前代码，`parseGoal` 能识别：

- `primaryGoal: "fat_loss"`
- `targetWeight: 72`
- `trainingDaysPerWeek: 3`
- `sessionDurationMinutes: 45`
- `frequentTravel: true`
- `constraints` 包含 `frequent_travel`

当前实现暂未把“**不想掉力量**”识别为 `strength_maintenance`；现有规则更偏向匹配“保持力量 / 不掉力量 / 维持力量”。本轮 smoke 测试记录该差异但不修改业务规则。

### 长期期望输出

后续正式拆分或增强 `goal-parser` 时，应把“不能掉力量 / 不想掉力量 / 不希望力量下降”等表达统一识别为 `strength_maintenance`。

### 关联 smoke checklist 项

- 目标设定：能解析减脂目标。
- 目标设定：能解析出差约束。
- 目标设定：能解析每周训练次数。
- 目标设定：能解析单次训练时长。

## 2. 计划生成：完整健身房增肌 4 练

### 用例名称

`generatePlan_muscle_gain_full_gym_four_days`

### 关联函数

- `generatePlan`
- `planDayTypes`
- `buildPlanDay`
- `isAvailable`

### 输入数据

```js
{
  gym: {
    id: "gym_full",
    name: "完整健身房",
    equipment: ["barbell", "dumbbell", "bench", "squat_rack", "cable", "lat_pulldown", "leg_press", "treadmill"]
  },
  goal: {
    parsed: {
      primaryGoal: "muscle_gain",
      primaryGoalLabel: "增肌",
      secondaryGoal: null,
      trainingDaysPerWeek: 4,
      sessionDurationMinutes: 60,
      frequentTravel: false,
      constraints: []
    }
  },
  metrics: [],
  exercises: FitnessData.exercises
}
```

### 期望输出要点

- 生成 4 个训练日。
- 训练日结构为 `push / pull / lower / upper` 或等价的推、拉、下肢、上肢结构。
- 每个训练日包含计划动作。
- 主要计划动作应优先匹配完整健身房可用器械。
- `context.goalLabel` 能体现增肌目标。

### 关联 smoke checklist 项

- 训练计划：能按当前目标和当前场地生成计划。
- 训练计划：计划包含多个训练日。
- 训练计划：每个训练日包含动作列表。

## 3. 计划生成：酒店健身房出差目标

### 用例名称

`generatePlan_travel_hotel_gym_available_substitutes`

### 关联函数

- `generatePlan`
- `pickAvailableExercise`
- `availableSubstitutes`
- `isAvailable`

### 输入数据

```js
{
  gym: {
    id: "gym_hotel",
    name: "酒店健身房",
    equipment: ["dumbbell", "bench", "cable", "mat", "treadmill", "bike", "bands"]
  },
  goal: {
    parsed: {
      primaryGoal: "fat_loss",
      primaryGoalLabel: "减脂",
      secondaryGoal: "strength_maintenance",
      secondaryGoalLabel: "保持力量",
      trainingDaysPerWeek: 3,
      sessionDurationMinutes: 45,
      frequentTravel: true,
      constraints: ["frequent_travel"]
    }
  },
  metrics: [],
  exercises: FitnessData.exercises
}
```

### 期望输出要点

- 生成 3 个训练日。
- 不把明显缺器械的动作作为可执行主动作，例如需要深蹲架但酒店健身房没有深蹲架的动作不应标为可执行。
- 优先推荐哑铃、弹力带、垫子、有氧器械等可执行动作。
- `context.notes` 应体现出差或器械受限。
- 缺器械时应出现替代动作或相应 notes。

### 关联 smoke checklist 项

- 训练计划：酒店健身房缺少器械时能触发替代动作。
- 健身房 / 场地：当前场地能影响训练计划中的替代动作。

## 4. 动作反馈分析：左侧半程、握力限制、背部感觉弱

### 用例名称

`analyzeExerciseFeedback_left_reduced_rom_grip_poor_back_feel`

### 关联函数

- `analyzeExerciseFeedback`

### 输入数据

```js
{
  input: {
    exerciseId: "lat_pulldown",
    freeText: "左侧最后几个半程，小臂先酸了，背没什么感觉",
    rangeOfMotion: "reduced_late",
    sideIssue: "left_weaker",
    limitingFactor: "grip",
    targetMuscleFeel: "weak",
    quality: "ok",
    rpe: 9,
    painScore: 0,
    painArea: ""
  },
  exercise: {
    id: "lat_pulldown",
    name: "高位下拉",
    pattern: "垂直拉",
    muscles: ["背阔肌", "肱二头肌"]
  }
}
```

### 期望输出要点

- 识别左右差，标签包含 `left_weaker`。
- 识别后程半程，标签包含 `reduced_rom_late`。
- 识别握力限制，标签包含 `grip_limiting`。
- 识别目标肌肉感觉弱，标签包含 `poor_target_muscle_feel`。
- 建议包含不加重或先恢复完整幅度。
- 建议包含弱侧优先。
- 建议包含助力带、稳定划船或更稳定版本。

### 关联 smoke checklist 项

- 今日训练：能保存动作级反馈。
- 今日训练：保存动作级反馈后能生成对应智能建议。
- 智能教练：能展示动作反馈历史。

## 5. 动作反馈分析：卧推肩前侧疼痛

### 用例名称

`analyzeExerciseFeedback_bench_shoulder_pain`

### 关联函数

- `analyzeExerciseFeedback`

### 输入数据

```js
{
  input: {
    exerciseId: "bench_press",
    freeText: "卧推肩前侧不舒服，疼痛 3/5",
    rangeOfMotion: "full",
    sideIssue: "none",
    limitingFactor: "joint_pain",
    targetMuscleFeel: "moderate",
    quality: "ok",
    rpe: 8,
    painScore: 3,
    painArea: "肩前侧"
  },
  exercise: {
    id: "bench_press",
    name: "杠铃卧推",
    pattern: "水平推",
    muscles: ["胸", "肱三头肌"]
  }
}
```

### 期望输出要点

- 识别疼痛风险，标签包含 `pain_risk`。
- 优先级应为高或至少高于普通观察建议。
- 不建议加重。
- 建议降量、降强度、缩小风险动作范围或替代动作。
- evidence 中包含疼痛评分和疼痛部位。

### 关联 smoke checklist 项

- 今日训练：能保存动作级反馈。
- 智能教练：能展示 advice 的优先级、标签、正文、依据或推荐项。

## 6. 饮食解析：蛋白、漏午餐、威化、火锅

### 用例名称

`parseNutritionLog_common_day_with_missed_lunch_and_hotpot`

### 关联函数

- `parseNutritionLog`

### 输入数据

```text
早上吃了5个鸡蛋蛋白一个地瓜一碗豆浆一点炒面，中午没吃饭吃了四个威化，晚上吃了牛肉火锅
```

### 期望输出要点

- 识别早餐、午餐、晚餐。
- 识别鸡蛋蛋白、地瓜、豆浆、威化、牛肉火锅。
- 识别漏正餐或零食替代正餐。
- 生成热量估算。
- 生成蛋白估算。
- 生成碳水估算。
- 生成脂肪估算。
- 生成纤维估算。
- 输出置信度。
- 输出饮食建议。
- 标签应体现高蛋白、加工零食、高油 / 高钠可能、分量不确定等至少部分结构判断。

### 关联 smoke checklist 项

- 饮食记录：能识别示例。
- 饮食记录：能生成营养估算、标签、置信度和建议。

## 7. 指标趋势：近 21 / 30 天体重变化

### 用例名称

`metricTrend_weight_delta_with_two_or_more_entries`

### 关联函数

- `metricTrend`
- `sortedMetrics`

### 输入数据

```js
[
  { id: "metric_1", date: "2026-06-01", weight: 78.0, bodyFat: 20.0, skeletalMuscle: 34.0, waist: 86 },
  { id: "metric_2", date: "2026-06-15", weight: 77.2, bodyFat: 19.5, skeletalMuscle: 34.1, waist: 85 },
  { id: "metric_3", date: "2026-06-29", weight: 76.8, bodyFat: 19.1, skeletalMuscle: 34.0, waist: 84.5 }
]
```

### 期望输出要点

- 两条以上体重记录能计算近 21 天变化。
- 两条以上体重记录能计算近 30 天变化。
- 返回值包含 `delta`。
- 空数组或缺失字段不崩溃，返回 `null` 或等价空结果。

### 关联 smoke checklist 项

- 身体指标：至少两条数据时趋势图能显示。
- 身体指标：近期指标能参与首页建议。

## 8. 训练容量统计：容量、有效组和简单 PR

### 用例名称

`trainingStats_volume_hard_sets_simple_pr`

### 关联函数

- `calculateVolumeLoad`
- `calculateHardSets`
- `detectSimplePr`

### 输入数据

```js
{
  previous: [
    {
      exerciseId: "bench_press",
      sets: [
        { loadKg: 60, reps: 8, rpe: 8 },
        { loadKg: 60, reps: 8, rpe: 8 }
      ]
    }
  ],
  current: {
    exerciseId: "bench_press",
    sets: [
      { loadKg: 65, reps: 8, rpe: 8 },
      { loadKg: 65, reps: 8, rpe: 8.5 },
      { loadKg: 60, reps: 10, rpe: 9 }
    ]
  }
}
```

### 期望输出要点

- `calculateVolumeLoad` 返回 `1640`。
- `calculateHardSets` 返回 `3`。
- `detectSimplePr` 识别至少一个简单 PR。
- 当前第一版至少识别容量 PR 和最大重量 PR。

### 关联 smoke checklist 项

- 动作级反馈：能保存动作级反馈。
- 智能教练：能展示动作长期画像。
- 周复盘：后续可基于容量和有效组生成更稳定建议。

## 9. 周复盘：训练、饮食、身体指标联动

### 用例名称

`buildWeeklyReview_integrated_training_nutrition_metrics`

### 关联函数

- `buildWeeklyReview`
- `buildIntegratedSignals`
- `buildNutritionProfile`
- `buildExerciseProfiles`

### 输入数据

```js
{
  goal: {
    parsed: {
      primaryGoal: "fat_loss",
      secondaryGoal: "strength_maintenance",
      trainingDaysPerWeek: 3
    }
  },
  metrics: [
    { id: "metric_1", date: "2026-06-01", weight: 78.0 },
    { id: "metric_2", date: "2026-06-29", weight: 78.1 }
  ],
  sessions: [
    { id: "session_1", date: "2026-06-24", completion: 95, rpe: 7, painScore: 0, fatigue: 3, dayIndex: 0, focus: "上肢力量" },
    { id: "session_2", date: "2026-06-27", completion: 65, rpe: 9, painScore: 2, fatigue: 4, dayIndex: 1, focus: "下肢力量" }
  ],
  exerciseLogs: [
    { id: "log_1", date: "2026-06-27", exerciseId: "lat_pulldown", exerciseName: "高位下拉", rpe: 9, painScore: 0, quality: "ok", analysis: { tags: [{ tag: "grip_limiting" }] } }
  ],
  nutritionLogs: [
    { id: "nutrition_1", date: "2026-06-26", analysis: { tags: ["missed_meal", "daily_protein_gap"], confidence: "medium", estimates: { total: { protein: 80 } }, meals: [] } }
  ],
  plan: {
    days: [
      { focus: "上肢力量", exercises: [] },
      { focus: "下肢力量", exercises: [] }
    ]
  }
}
```

### 期望输出要点

- 输出最近 7 天训练次数。
- 输出平均完成度。
- 输出平均 RPE。
- 输出饮食问题，例如蛋白缺口或漏正餐。
- 输出下周建议。
- 可以生成计划调整候选，但候选不自动应用。
- 返回值只描述候选，不直接修改 `plan`。

### 关联 smoke checklist 项

- 智能教练：能生成周复盘。
- 智能教练：周复盘能展示训练次数、平均完成度、平均 RPE、平均疲劳、蛋白缺口天数、漏正餐天数或体重变化。
- 智能教练：周复盘候选不会静默修改计划，必须点击后才应用。

## 10. 联动建议与提前提醒

### 用例名称

`buildIntegratedSignals_fat_loss_plateau_low_protein_lunch_missed`

### 关联函数

- `buildIntegratedSignals`

### 输入数据

- 减脂目标。
- 近 21 天体重基本不变。
- 最近训练 RPE 偏高、完成度下降。
- 饮食记录存在蛋白缺口、漏午餐、零食或高油外食标签。
- 动作反馈里存在疼痛风险标签。

### 期望输出要点

- 返回联动建议数组。
- 至少包含训练 / 饮食 / 恢复 / 疼痛风险中的部分语义。
- 建议证据能反映体重平台、午餐缺失、蛋白缺口或疼痛风险。

### 关联 smoke checklist 项

- 今日训练：保存后能生成智能建议。
- 智能教练：能展示 advice。
- 智能教练：能展示动作长期画像和饮食长期画像。

### 用例名称

`buildTrainingReminders_profile_and_integrated_signals`

### 关联函数

- `buildTrainingReminders`

### 输入数据

- 当前训练日包含高位下拉和卧推。
- 高位下拉历史动作反馈包含握力限制和后程半程。
- 卧推历史动作反馈包含疼痛风险。
- 同时提供基础训练、饮食和身体指标上下文。

### 期望输出要点

- 返回训练前提醒数组。
- 提醒类型为 `training`。
- 文案或标签体现动作画像风险，例如握力限制、疼痛风险、低风险版本或动作质量。

### 关联 smoke checklist 项

- 今日训练：能看到今日训练动作。
- 智能教练：能展示动作长期画像。
- 智能教练：能展示动作反馈历史。

### 用例名称

`buildNutritionReminders_low_protein_lunch_missed`

### 关联函数

- `buildNutritionReminders`

### 输入数据

- 减脂目标。
- 最近饮食记录连续出现蛋白缺口、漏午餐和分量不确定。
- 提供基础训练和身体指标上下文。

### 期望输出要点

- 返回饮食前提醒数组。
- 提醒类型为 `nutrition`。
- 文案或标签体现蛋白、午餐、正餐连续性或饮食前提醒。

### 关联 smoke checklist 项

- 饮食记录：能生成营养估算、标签、置信度和建议。
- 智能教练：能展示饮食长期画像。
- 今日训练：能生成首页联动建议。

## 当前无依赖 smoke 脚本覆盖

当前 [../tests/rules-smoke.html](../tests/rules-smoke.html) 覆盖 12 个用例：

- `parseGoal` 的主目标、目标体重、训练频率、出差约束。
- `generatePlan` 的完整健身房四练和酒店健身房出差替代。
- `analyzeExerciseFeedback` 的 `pain_risk`、`grip_limiting`、`reduced_rom_late`、左右差和目标肌肉感觉弱。
- `parseNutritionLog` 的餐次、食物项、标签、估算和建议。
- `metricTrend` 的趋势计算和空数组保护。
- `calculateVolumeLoad`、`calculateHardSets`、`detectSimplePr` 的基础训练统计。
- `buildWeeklyReview` 的训练 / 饮食 / 指标整合和不静默改计划。
- `buildIntegratedSignals`、`buildTrainingReminders`、`buildNutritionReminders` 的联动建议和提前提醒。

脚本只输出 `pass/fail` 和详情，不引入 npm、构建链或测试框架。
