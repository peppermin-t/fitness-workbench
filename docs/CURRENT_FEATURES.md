# 当前功能清单

本文档按当前代码实际实现梳理功能边界，主要依据 `README.md`、`docs/PRODUCT_VISION.md`、`index.html`、`data.js`、`src/core/rules/*`、`src/app/storage/*`、`src/app/import-export/*`、`src/app/charts/*`、`src/core/models/index.d.ts`、`planner.js`、`app.js` 和 `styles.css`。当前应用仍可直接双击运行：静态 Web 通过 `index.html` 加载 `data.js`、`src/core/rules/*.js`、`src/core/rules/facade.js`、`planner.js`、`src/app/storage/*.js`、`src/app/import-export/*.js`、`src/app/charts/*.js`、`app.js`，运行数据存放在浏览器 `localStorage`。Tauri 环境下会额外通过 `src/app/storage/desktop-sqlite.js` 同步到 SQLite。Phase 4 后，`src/core/rules/*.ts`、`src/app/storage/*.ts`、`src/app/import-export/*.ts` 和 `src/app/charts/*.ts` 是 core / app helper 源文件，同名 `.js` 是浏览器兼容输出；`window.FitnessCore.Rules` 是当前 UI 使用的规则 facade，`planner.js` 仅保留 `window.FitnessPlanner` 旧入口兼容。

## 1. 今日训练

### 当前已有能力

- 在首页选择当前健身房。
- 显示当前场地器械摘要。
- 基于当前目标、身体指标、训练记录、动作反馈和饮食记录生成“今日建议”。
- 显示训练前提醒。
- 从当前训练计划中选择训练日并展示当天动作。
- 支持从今日页触发生成 / 刷新训练计划。
- 提供动作级反馈入口和训练整体反馈入口。
- 动作反馈保存时会创建或复用当天训练日的 `WorkoutSession`，并写入 `ExerciseLog.sessionId`。

### 主要代码位置

- `index.html`：`view-today` 区域，包括当前场地、今日建议、今日训练、动作级反馈、训练反馈表单。
- `app.js`：`renderTodayAdvice`、`renderTrainingReminders`、`renderTodayPlanSelect`、`renderTodayWorkout`、`saveExerciseLog`、`saveSessionFeedback`。
- `src/core/rules/exercise-feedback-analyzer.js`：动作级反馈分析。
- `src/core/rules/integrated-signals.js`：`buildLinkedTodayInsights`、`buildTrainingReminders`、`buildIntegratedSignals`。
- `src/core/rules/facade.js`：汇总 core 规则为 `window.FitnessCore.Rules`，供 `app.js` 使用。
- `planner.js`：兼容导出 `window.FitnessPlanner.analyzeExerciseFeedback`、`window.FitnessPlanner.buildTrainingReminders`、`window.FitnessPlanner.buildLinkedTodayInsights` 等旧入口。

### 依赖的数据状态

- `state.currentGymId`
- `state.currentGoalId`
- `state.gyms`
- `state.goals`
- `state.metrics`
- `state.plan`
- `state.sessions`
- `state.exerciseLogs`
- `state.nutritionLogs`
- `state.advice`
- `state.revisions`

### 与其他模块的交互关系

- 读取目标设定决定训练目标和建议口径。
- 读取当前健身房决定动作是否可做和替代动作。
- 读取训练计划决定今日训练日和动作列表。
- 写入训练整体反馈到 `sessions` 和 `feedback`。
- 写入动作级反馈到 `exerciseLogs`。
- 写入智能建议到 `advice`。
- 写入计划调整候选到 `revisions`。

### 当前缺口

- `WorkoutSession` 已有 `in_progress` / `completed` 第一版状态，但还没有完整开始、暂停、跳过和计时流程。
- 动作反馈已支持可选每组级 `SetLog`，但仍保留快速文本录入，历史旧数据可能没有 `sets`。
- 今日训练日选择依赖 `dayIndex`，没有真实日期和训练 session 的稳定绑定。
- 今日建议来自多个规则函数，但缺少可测试的规则用例。

## 2. 目标设定

### 当前已有能力

- 用户输入自然语言目标。
- 本地规则解析主要目标、次要目标、目标体重、每周训练天数、单次训练时长、出差和便利性约束。
- 保存目标列表。
- 设定当前目标。
- 当前目标参与计划生成、饮食判断、联动建议和周复盘。

### 主要代码位置

- `index.html`：`view-goals`、目标输入、解析按钮、保存按钮、目标列表容器。
- `app.js`：`saveGoal`、`renderParsedGoal`、`renderGoalsList`、`currentGoal`。
- `src/core/rules/goal-parser.js`：目标解析逻辑。
- `planner.js`：兼容导出 `window.FitnessPlanner.parseGoal`，并在计划、营养和联动规则中读取目标结构。

### 依赖的数据状态

- `state.goals`
- `state.currentGoalId`
- 临时状态 `parsedGoal`

### 与其他模块的交互关系

- 训练计划生成读取 `goal.parsed`。
- 饮食解析和建议读取 `goal.parsed.primaryGoal`。
- 周复盘和首页联动读取当前目标。
- 数据导入导出包含目标数据。

### 当前缺口

- 目标模型没有版本字段。
- 多目标之间没有生命周期状态，例如历史目标、已完成目标、暂停目标。
- 目标解析是关键词规则，复杂目标仍需要后续 AI 结构化解析或更强本地 parser。

## 3. 健身房 / 场地器械

### 当前已有能力

- 内置默认健身房、酒店健身房模板、居家 / 临时场地。
- 用户可新增健身房，填写名称、地点 / 备注和器械清单。
- 可设置当前健身房。
- 可删除非唯一健身房。
- 当前健身房限制训练计划生成和替代动作推荐。
- 有器械图例和中英双语展示的后续增强代码。

### 主要代码位置

- `data.js`：`equipment`、`defaultGyms`。
- `index.html`：`view-gyms`、健身房表单、器械 checklist、器械图例。
- `app.js`：`renderGymSelect`、`renderCurrentGymSummary`、`renderEquipmentChecklist`、`renderEquipmentLibrary`、`renderGymList`、`saveGym`、`deleteGym`、`currentGym`。
- `src/core/rules/plan-generator.js`：`isAvailable`、`availableSubstitutes`、`pickAvailableExercise`。
- `planner.js`：兼容导出 `window.FitnessPlanner.isAvailable`、`window.FitnessPlanner.availableSubstitutes`。

### 依赖的数据状态

- `state.gyms`
- `state.currentGymId`
- `FitnessData.equipment`
- `FitnessData.defaultGyms`

### 与其他模块的交互关系

- 计划生成按当前场地器械筛选动作。
- 今日训练和动作库展示动作是否适配当前场地。
- 手动替换动作会写入 `revisions`。

### 当前缺口

- 器械是字符串 ID 列表，没有独立的用户自定义器械模型。
- 健身房只能新增和删除，不能编辑已有健身房。
- 器械可用性是“有 / 无”，没有数量、型号、负重范围、是否临时不可用等信息。

## 4. 动作库

### 当前已有能力

- 静态内置动作库，包含动作 ID、中文名、动作模式、目标肌群、所需器械、替代动作、技术提示、风险提示、示例链接。
- 动作列表可搜索。
- 展示当前场地是否可做。
- 展示当前场地替代动作。
- 有中英双语名称展示；此前未实际展示的器械 SVG 图标、肌肉示意图和动作媒体样式已移除。

### 主要代码位置

- `data.js`：`exercises` 静态主数据。
- `index.html`：`view-exercises`。
- `app.js`：`renderExerciseList`、`renderPlanRow`、`findOrCreateExercise`、`exerciseEnglishName`、`equipmentEnglishLabel`、`equipmentDisplayText`。
- `src/core/rules/plan-generator.js`：动作可用性和替代动作逻辑。
- `planner.js`：兼容导出 `window.FitnessPlanner.availableSubstitutes`、`window.FitnessPlanner.isAvailable`。

### 依赖的数据状态

- `state.exercises`
- `FitnessData.exercises`
- `state.currentGymId`
- `state.gyms`

### 与其他模块的交互关系

- 训练计划引用动作 ID。
- 今日训练和计划页按动作库展示动作详情和替代动作。
- 动作级反馈读取动作模式和肌群，用于分析握力限制、目标肌肉感觉和风险。
- CSV 导入中如果找不到动作，会通过 `findOrCreateExercise` 创建极简自定义动作。

### 当前缺口

- 动作库没有正式编辑 UI。
- `findOrCreateExercise` 只为 CSV 导入创建最小动作，字段不完整。
- 静态主数据和业务语义混在 `data.js`，例如替代关系、风险提示和示例链接都在同一个对象中。
- 动作库当前以文字、标签和外部示例链接为主；不再保留未展示的内置图标 / 肌肉图代码。

## 5. 训练计划

### 当前已有能力

- 基于当前目标、当前健身房、身体指标生成训练计划。
- 训练天数随目标解析出的每周训练次数变化。
- 支持上肢、下肢、全身、推、拉、恢复 / 有氧等训练日模板。
- 每个计划动作包含动作 ID、组数、次数 / 时长、重量、RPE、休息、备注。
- 当前场地缺器械时优先选择可用替代动作。
- 支持手动替换计划中的动作，并记录调整原因。
- 支持导出 CSV。
- 支持导入 CSV 生成计划。

### 主要代码位置

- `index.html`：`view-plan`、生成计划、导出 CSV、导入 CSV。
- `app.js`：`generatePlan`、`renderPlan`、`renderWorkoutDay`、`renderPlanRow`、`replaceExercise`、`exportPlanCsv`、`importPlanCsv` 的 UI 事件和状态写入。
- `src/app/import-export/data-portability.js`：训练计划 CSV 构造和解析 helper。
- `src/core/rules/plan-generator.js`：训练计划生成、训练日模板、动作可用性和替代动作逻辑。
- `planner.js`：兼容导出 `window.FitnessPlanner.generatePlan`、`window.FitnessPlanner.isAvailable`、`window.FitnessPlanner.availableSubstitutes` 等 API。

### 依赖的数据状态

- `state.plan`
- `state.gyms`
- `state.currentGymId`
- `state.goals`
- `state.currentGoalId`
- `state.metrics`
- `state.exercises`
- `state.revisions`
- `state.advice`

### 与其他模块的交互关系

- 目标、健身房、身体指标共同影响计划生成。
- 今日训练读取当前计划。
- 训练整体反馈和动作级反馈记录计划上下文。
- 智能教练中的 revision 可修改当前计划。
- CSV 导入 / 导出围绕 `state.plan`。

### 当前缺口

- 计划只有当前一份，没有计划历史、计划周期、开始 / 结束日期。
- `WorkoutDay` 没有唯一 ID，仅依赖数组下标。
- `PlannedExercise` 没有唯一 ID，动作替换依赖 `dayIndex` 和 `rowIndex`。
- CSV 解析是简单按逗号拆分，对复杂 CSV 的兼容性有限。
- 计划生成规则没有测试保护。

## 6. 训练整体反馈

### 当前已有能力

- 训练后填写完成度、平均 RPE、疼痛评分、疼痛部位、睡眠、疲劳、备注。
- 保存为 `session`，并同步写入旧的 `feedback` 数组。
- 根据反馈生成智能建议。
- 根据疼痛、完成度、恢复状态、进阶条件生成计划调整候选。

### 主要代码位置

- `index.html`：`session-form`。
- `app.js`：`saveSessionFeedback`、`renderCoach`、`renderWeeklyReview`。
- `src/core/rules/advice-engine.js`：`createAdviceFromSession`、`revision`、建议结构和优先级 helper。
- `src/core/rules/weekly-review.js`：`buildWeeklyReview`。
- `src/core/rules/integrated-signals.js`：`buildIntegratedSignals`。
- `planner.js`：兼容导出周复盘、联动和训练反馈建议 API。

### 依赖的数据状态

- `state.sessions`
- `state.feedback`
- `state.plan`
- `state.advice`
- `state.revisions`

### 与其他模块的交互关系

- 今日建议读取最近 session。
- 周复盘读取最近 7 天 sessions。
- 联动判断将 session 趋势与饮食、身体指标合并。
- 计划调整候选可修改当前计划。

### 当前缺口

- `WorkoutSession` 已有第一版状态和 `exerciseLogIds`，动作日志通过 `sessionId` 关联，但还没有完整执行状态机。
- `feedback` 与 `sessions` 存在概念重叠，`feedback` 更像旧数据或兼容字段。
- 没有 session 状态机，也没有训练开始时间、结束时间、耗时。

## 7. 动作级反馈

### 当前已有能力

- 按当前训练日动作填写动作级反馈。
- 记录计划组数、计划次数、计划重量、计划 RPE。
- 记录实际重量、实际次数、RPE、动作质量、动作幅度、目标肌肉感觉、限制因素、左右差异、疼痛评分、疼痛部位、自由文本。
- 本地规则识别半程、左右差、握力限制、目标肌肉感觉弱、动作质量下降、疼痛风险、可进阶等标签。
- 保存动作级历史。
- 智能教练页支持按动作筛选历史和查看动作长期画像。

### 主要代码位置

- `index.html`：`exercise-log-form`、动作历史筛选区域。
- `app.js`：`saveExerciseLog`、`renderExerciseLogSelect`、`renderExerciseLogList`、`renderExerciseHistoryFilter`、`renderExerciseHistory`、`buildExerciseHistorySummary`。
- `src/core/rules/exercise-feedback-analyzer.js`：动作反馈分析、动作长期画像、动作反馈建议。
- `src/core/rules/training-stats.js`：训练容量、有效组数和简单 PR 判断。
- `src/core/rules/integrated-signals.js`：训练前提醒会读取动作长期画像。
- `planner.js`：兼容导出 `window.FitnessPlanner.analyzeExerciseFeedback`、`window.FitnessPlanner.buildExerciseProfiles`、`window.FitnessPlanner.buildTrainingReminders`、`window.FitnessPlanner.calculateVolumeLoad` 等 API。

### 依赖的数据状态

- `state.exerciseLogs`
- `state.plan`
- `state.exercises`
- `state.advice`

### 与其他模块的交互关系

- 动作级反馈写入智能建议。
- 动作长期画像影响训练前提醒和首页联动。
- 周复盘读取最近动作反馈。
- 计划动作上下文用于对比计划和实际。

### 当前缺口

- 已支持可选 `sets`，并在可解析时写入 `loadKg`、`reps`、`rpe`、`completed`、`note`。
- 已计算基础 `volumeLoad`、`hardSets` 和 `simplePr`，但规则仍是第一版。
- 旧动作日志可能没有 `sets` 和 `sessionId`，当前 `schemaVersion: 2` 迁移会补齐默认值。
- 还没有失败组、热身组、目标组完成度等更细字段。

## 8. 身体指标

### 当前已有能力

- 记录日期、体重、体脂、骨骼肌、腰围、备注。
- 按日期排序。
- 展示列表。
- 使用 canvas 绘制体重、体脂、骨骼肌趋势。
- 计算指定天数内指标趋势。
- 体重趋势参与计划上下文、首页联动和周复盘。

### 主要代码位置

- `index.html`：`view-metrics`、`metric-form`、`metric-chart`、`metric-list`。
- `app.js`：`saveMetric`、`deleteMetric`、`renderMetrics`、`drawMetricChart`、`latestMetric`。
- `src/app/charts/line-chart.js`：通用 canvas 折线图绘制 helper。
- `src/core/rules/metric-analyzer.js`：`sortedMetrics`、`metricTrend`。
- `src/core/rules/plan-generator.js`：`buildPlanContext` 读取最近指标和体重趋势。
- `src/core/rules/integrated-signals.js`：联动判断读取指标趋势。
- `src/core/rules/weekly-review.js`：周复盘读取指标趋势。
- `planner.js`：兼容导出 `window.FitnessPlanner.sortedMetrics`、`window.FitnessPlanner.metricTrend`。

### 依赖的数据状态

- `state.metrics`

### 与其他模块的交互关系

- 训练计划生成读取最近指标和体重趋势。
- 饮食建议理论上可读取最近指标作为目标估算输入，但当前 `app.js` 调用 `parseNutritionLog(rawText, currentGoal())` 没有传入 `latestMetric`。
- 周复盘和首页联动读取身体指标趋势。

### 当前缺口

- 指标字段固定，不能扩展更多指标。
- 缺少体重 / 体脂等字段的单位 schema。
- 没有异常值提示或重复日期处理策略。
- 饮食解析没有实际传入最近身体指标，联动深度可补强。

## 9. 饮食记录

### 当前已有能力

- 用户用自然语言输入当天饮食。
- 本地规则拆分早餐、午餐、晚餐、加餐。
- 内置小型食物库，识别常见食物、数量、模糊分量和营养估算。
- 生成饮食标签、总热量 / 蛋白 / 碳水 / 脂肪 / 纤维估算、置信度、缺失信息提示。
- 生成饮食建议并写入智能建议。
- 展示饮食记录、趋势图和长期饮食画像。
- 删除饮食记录。

### 主要代码位置

- `index.html`：`view-nutrition`、`nutrition-form`、`nutrition-chart`。
- `app.js`：`saveNutritionLog`、`renderNutritionList`、`drawNutritionChart`、`renderNutritionReminders`。
- `src/app/charts/line-chart.js`：饮食趋势图使用的通用 canvas 折线图绘制 helper。
- `src/core/rules/nutrition-parser.js`：`FOOD_LIBRARY`、`parseNutritionLog`、`splitMeals`、`extractFoodItems`、`nutritionTargets`、`buildNutritionRecommendationItems`、`buildNutritionProfile`、`buildNutritionTrend`、`buildNutritionReminders`。
- `planner.js`：兼容导出 `window.FitnessPlanner.parseNutritionLog`、`window.FitnessPlanner.buildNutritionProfile`、`window.FitnessPlanner.buildNutritionTrend`、`window.FitnessPlanner.buildNutritionReminders`。

### 依赖的数据状态

- `state.nutritionLogs`
- `state.goals`
- `state.currentGoalId`
- `state.advice`

### 与其他模块的交互关系

- 当前目标影响饮食目标和建议。
- 饮食长期画像影响首页联动、饮食前提醒和周复盘。
- 饮食记录与训练整体反馈共同参与“供能不足”“减脂期力量下滑”等联动判断。

### 当前缺口

- 不是完整营养 App，食物库很小，营养估算是粗略规则。
- 没有用户自定义食物库。
- 没有精确称重、营养标签扫码、微量营养素或完整营养数据库。
- 没有把最近身体指标传入饮食解析目标估算。

## 10. 智能教练

### 当前已有能力

- 汇总训练、动作、饮食、计划生成产生的建议。
- 建议包含标题、正文、标签、优先级、依据、推荐项。
- 展示计划调整记录。
- 支持应用待确认的计划调整。
- 显示周复盘、调整候选、动作长期画像、动作反馈历史和饮食长期画像。

### 主要代码位置

- `index.html`：`view-coach`。
- `app.js`：`renderCoach`、`renderWeeklyReview`、`applyReviewCandidate`、`applyRevision`、`renderProfiles`、`renderExerciseHistory`。
- `src/core/rules/advice-engine.js`：建议结构、推荐项、优先级和去重 helper。
- `src/core/rules/exercise-feedback-analyzer.js`：动作长期画像。
- `src/core/rules/nutrition-parser.js`：饮食长期画像、饮食趋势和饮食提醒。
- `src/core/rules/integrated-signals.js`：训练、饮食、身体指标的联动建议和今日提醒。
- `src/core/rules/weekly-review.js`：周复盘和计划调整候选。
- `src/core/rules/facade.js`：汇总智能教练所需规则入口。
- `planner.js`：兼容导出 `window.FitnessPlanner.analyzeExerciseFeedback`、`window.FitnessPlanner.buildExerciseProfiles`、`window.FitnessPlanner.buildNutritionProfile`、`window.FitnessPlanner.buildIntegratedSignals`、`window.FitnessPlanner.buildWeeklyReview`、`window.FitnessPlanner.createAdviceFromSession` 等旧 API。

### 依赖的数据状态

- `state.advice`
- `state.revisions`
- `state.plan`
- `state.sessions`
- `state.exerciseLogs`
- `state.nutritionLogs`
- `state.metrics`

### 与其他模块的交互关系

- 接收训练整体反馈、动作级反馈、饮食记录、计划生成产生的建议。
- 根据周复盘候选写入或应用 `revisions`。
- 修改训练计划时只通过用户点击确认触发，不会静默修改。

### 当前缺口

- 建议来源分散，既在 `app.js` 中直接构造，也在 `planner.js` 中构造。
- `advice` 没有统一的状态流转，例如已读、忽略、已执行、过期。
- 建议去重和生命周期管理较弱。

## 11. 周复盘

### 当前已有能力

- 读取最近 7 天训练、动作、饮食记录。
- 统计训练次数、平均完成度、平均 RPE、平均疲劳、蛋白缺口天数、漏正餐天数、近 30 天体重变化。
- 生成本周重点和下周优先动作。
- 根据疼痛、完成度、稳定训练、减脂体重趋势生成计划调整候选。
- 候选需要用户点击后才应用到计划。

### 主要代码位置

- `index.html`：智能教练页中的周复盘区域。
- `app.js`：`renderWeeklyReview`、`applyReviewCandidate`、`findMatchingRevision`、`candidatePatchSignature`。
- `src/core/rules/weekly-review.js`：`buildWeeklyReview`、`revision`、`dedupeCandidates`、`findConditioningDayIndex`。
- `planner.js`：兼容导出 `window.FitnessPlanner.buildWeeklyReview`。

### 依赖的数据状态

- `state.sessions`
- `state.exerciseLogs`
- `state.nutritionLogs`
- `state.metrics`
- `state.plan`
- `state.revisions`

### 与其他模块的交互关系

- 使用训练、饮食、身体指标和当前计划。
- 输出 `Revision` 候选或直接应用到当前计划。
- 与智能教练页共享展示位置。

### 当前缺口

- 周期固定为最近 7 天，不能配置。
- 没有“保存一份周复盘报告”的模型。
- 调整候选 patch 类型有限。
- 缺少测试，后续规则变更容易影响旧逻辑。

## 12. 长期画像

### 当前已有能力

- 动作长期画像：按动作聚合反馈次数、RPE、疼痛、低质量次数和高频标签。
- 饮食长期画像：聚合高频饮食标签、漏餐、蛋白缺口、不确定记录和营养均值。
- 画像参与训练前提醒、饮食前提醒、首页联动和智能教练展示。

### 主要代码位置

- `app.js`：`renderProfiles`、`renderTrainingReminders`、`renderNutritionReminders`。
- `src/core/rules/exercise-feedback-analyzer.js`：`buildExerciseProfiles`。
- `src/core/rules/nutrition-parser.js`：`buildNutritionProfile`、`buildNutritionReminders`。
- `src/core/rules/integrated-signals.js`：`buildIntegratedSignals`、`buildTrainingReminders`。
- `planner.js`：兼容导出 `window.FitnessPlanner.buildExerciseProfiles`、`window.FitnessPlanner.buildNutritionProfile`、`window.FitnessPlanner.buildIntegratedSignals`、`window.FitnessPlanner.buildTrainingReminders`、`window.FitnessPlanner.buildNutritionReminders`。

### 依赖的数据状态

- `state.exerciseLogs`
- `state.nutritionLogs`
- `state.sessions`
- `state.metrics`
- `state.goals`

### 与其他模块的交互关系

- 画像由动作反馈和饮食记录沉淀。
- 画像反向影响今日训练、饮食记录前提醒和周复盘。

### 当前缺口

- 画像是即时计算结果，没有独立存档。
- 没有明确画像版本和证据窗口。
- 没有用户确认 / 否认画像结论的入口。

## 13. 导入导出 / 数据备份

### 当前已有能力

- 导出全部 `state` 为 JSON。
- 导入 JSON 并覆盖 localStorage。
- 恢复初始数据。
- 导出当前训练计划 CSV。
- 导入 CSV 生成当前训练计划。
- 数据摘要显示主要对象数量。

### 主要代码位置

- `index.html`：`view-data` 和计划页 CSV 导入导出。
- `app.js`：`exportJson`、`importJson`、`resetData`、`exportPlanCsv`、`importPlanCsv`、`renderDataSummary` 的 UI 事件和状态写入。
- `src/app/import-export/data-portability.js`：JSON 备份序列化 / 解析、CSV 构造 / 解析和浏览器下载 helper。

### 依赖的数据状态

- 完整 `state`
- `localStorage` key：`fitness-coach-workbench-v1`

### 与其他模块的交互关系

- JSON 覆盖整个应用数据。
- CSV 只覆盖 / 生成 `state.plan`，不导入历史训练记录。

### 当前缺口

- `schemaVersion` 当前为 `2`。
- `src/app/storage/state-normalizer.js`：当前状态规范化、默认字段补齐、导入保护。
- `src/app/storage/app-state-store.js`：默认状态、localStorage 读写、Tauri SQLite hydration / persist 协调。
- JSON 导入会先通过 `data-portability` 解析，再经 `state-normalizer` 迁移，成功后才覆盖 localStorage；坏 JSON 不应覆盖旧数据。
- JSON 导入没有 schema 校验。
- CSV 导入解析简单，不支持复杂逗号、换行、引号边界。
- 没有自动备份或备份恢复前预检。

## 14. UI 与运行方式

### 当前已有能力

- 单页静态应用，无构建步骤。
- 侧边栏切换视图。
- localStorage 保存数据；Tauri 环境下额外同步 SQLite。
- canvas 绘制身体指标和饮食趋势。
- 样式集中在 `styles.css`，使用桌面工作台布局。

### 主要代码位置

- `index.html`
- `styles.css`
- `app.js`
- `src/app/storage/app-state-store.js`
- `src/app/import-export/data-portability.js`
- `src/app/charts/line-chart.js`

### 当前缺口

- `body` 设置 `min-width: 1100px`，当前定位更偏桌面端，不适合手机端。
- `app.js` 直接拼接 HTML，缺少组件边界。
- 默认状态、存储协调、CSV / JSON 构造解析 helper、通用 canvas 折线图 helper 已从 `app.js` 拆出；旧同名渲染 / 保存函数覆盖问题已清理；当前仍需继续拆 presenter 和业务状态写入。
