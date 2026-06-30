# 样例备份数据准备说明

本文档说明后续正式重构前应该准备怎样的人工测试用 JSON 备份。当前本轮只写 guide，不生成固定样例 JSON，避免在没有实际浏览器 localStorage 上下文时制造与运行状态不一致的假数据。

## 目标

准备一份可重复导入的 JSON 备份，用来在重构前后验证页面渲染、数据迁移、建议生成和导入导出是否回退。

## 样例文件

当前已准备一份可导入样例：

```text
docs/sample-data/manual-smoke-baseline.json
```

使用方式：打开 `index.html`，进入“导入导出”页，选择“导入 JSON”，导入该文件。导入后应用会刷新并从浏览器 localStorage 读取样例数据。当前真实 localStorage key 是 `fitness-coach-workbench-v1`，当前样例使用 `schemaVersion: 2`，不要为了样例数据修改运行中的存储 key。

## 最小数据要求

样例 JSON 至少应包含：

- 1 个当前目标。
- 2 个健身房，其中一个为当前健身房。
- 1 份训练计划。
- 2 条身体指标。
- 1 条训练整体反馈。
- 2 条动作级反馈。
- 1 条饮食记录。
- 1 条智能建议。
- 1 条 revision。

## 推荐样例内容

### 目标

建议使用一个能覆盖目标解析和计划生成的目标：

```text
我现在 78kg，想先减脂到 72kg，但不想掉太多力量。最近经常出差，一周练 3 次，每次 45 分钟。
```

应覆盖：

- `primaryGoal: fat_loss`
- `secondaryGoal: strength_maintenance`
- `targetWeight: 72`
- `trainingDaysPerWeek: 3`
- `sessionDurationMinutes: 45`
- `constraints` 包含出差相关标签

### 健身房

至少包含：

- 一个器械较完整的常用健身房。
- 一个酒店健身房或少器械场地。

少器械场地应能触发计划中的替代动作。

### 训练计划

训练计划应包含至少 3 个训练日：

- 上肢或推拉训练日。
- 下肢训练日。
- 恢复 / 有氧或全身训练日。

计划动作应包含：

- 至少 1 个当前场地可做动作。
- 至少 1 个因为场地限制发生替代的动作。

### 身体指标

至少两条不同日期数据，用于趋势图和 `metricTrend`：

- 日期较早的一条。
- 日期较新的一条。

字段建议包含：

- `weight`
- `bodyFat`
- `skeletalMuscle`
- `waist`
- `notes`

### 训练整体反馈

至少一条 `WorkoutSession` / 当前 `sessions` 记录，覆盖：

- `completion`
- `rpe`
- `painScore`
- `painArea`
- `sleep`
- `fatigue`
- `notes`

建议准备一条能触发建议或 revision 的记录，例如完成度低于 70，或疼痛评分大于等于 3。

### 动作级反馈

至少两条动作级反馈：

1. 一条背部拉类动作，反馈“小臂先酸、背没感觉”，用于触发握力限制和目标肌肉感觉弱。
2. 一条带疼痛或半程问题的动作，用于触发疼痛风险或动作幅度建议。

字段建议覆盖：

- `actualLoad`
- `actualReps`
- `rpe`
- `quality`
- `rangeOfMotion`
- `targetMuscleFeel`
- `limitingFactor`
- `sideIssue`
- `painScore`
- `painArea`
- `freeText`
- `sessionId`
- `sets`
- `volumeLoad`
- `hardSets`
- `simplePr`
- `analysis`

至少 1 条动作级反馈应包含 `sets`、`volumeLoad`、`hardSets` 和 `simplePr`，用于验证 Phase 3 的每组记录和基础训练容量统计。

### 饮食记录

建议使用以下自然语言记录：

```text
早上吃了5个蛋白一个地瓜一碗豆浆，中午没吃饭吃了四个威化，晚上吃了牛肉火锅。
```

应覆盖：

- 早餐 / 午餐 / 晚餐识别。
- 蛋白来源识别。
- 漏正餐或零食替代正餐。
- 高油 / 高钠外食不确定性。
- 营养估算、标签、置信度和建议。

### 智能建议

至少保留一条建议，最好来自训练反馈、动作反馈或饮食记录。

建议字段包括：

- `title`
- `body`
- `tags`
- `priority`
- `evidence`
- `recommendationItems`

### Revision

至少保留一条计划调整记录：

- `status` 可以是 `pending` 或 `applied`。
- `patch.type` 建议覆盖 `reduce_day_volume`、`trim_accessory` 或 `add_progression_note`。
- 必须能验证“未确认不应用，点击后才应用”的约束。

## 制作流程建议

1. 打开 `index.html`。
2. 如需干净环境，先在“导入导出”页恢复初始数据。
3. 按本文档录入目标、健身房、指标、计划、训练反馈、动作反馈和饮食记录。
4. 在“导入导出”页导出完整 JSON。
5. 将导出的 JSON 保存为样例基线文件。
6. 重新恢复初始数据。
7. 导入样例 JSON。
8. 按 [SMOKE_CHECKLIST.md](SMOKE_CHECKLIST.md) 验证页面正常渲染。

## 样例数据维护规则

- 每次 schemaVersion 升级后，都要验证旧样例能迁移。
- 如果字段新增，应优先通过迁移补默认值，而不是手动重写所有样例。
- 当前 `docs/sample-data/manual-smoke-baseline.json` 已升级到 `schemaVersion: 2`；一次性旧数据迁移代码已移除，后续新增 schema 时再补新的迁移说明和用例。
- 样例数据不应包含隐私信息。
- 样例数据应尽量覆盖真实业务链路，而不是只满足字段存在。
