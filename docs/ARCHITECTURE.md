# 架构与当前状态

本文档是当前维护入口。它替代早期的阶段计划、功能清单、数据模型草案和冗余审查文档。

## 重构状态

结构性重构已经完成：

- Phase 0 行为保护：已具备规则 smoke、样例 JSON 和人工验收路径。
- Phase 1/2 模块边界：核心规则已拆入 `src/core/rules/*`。
- Phase 3 数据底座：已有 `WorkoutSession`、`ExerciseLog`、`SetLog`、`schemaVersion` 规范化和导入保护。
- Phase 4 TypeScript：源码已全面转向 TS，根目录和 `src` 下不再提交 `.js` 源码。
- Phase 5 Tauri：桌面壳已接入。
- Phase 6 SQLite：Tauri 环境下已有 SQLite 状态快照和核心表镜像。

这表示“重构路线完成”，不表示产品功能已经最终完成。

## 运行模型

- 源码：`src/**/*.ts`
- 编译输出：`dist/generated/src/**/*.js`
- 桌面前端：`dist/desktop`
- 桌面壳：`src-tauri`
- UI 源文件：`src/app/index.html`
- UI 启动入口：`src/app/main.ts`
- 规则统一入口：`window.FitnessCore.Rules`，由 `src/core/rules/facade.ts` 汇总。

浏览器和 Tauri WebView 仍然运行 JS，所以 `dist/generated` 和 `dist/desktop` 中存在 JS 是正常的；这些是构建产物，不是源码双份。

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

- `src/app/main.ts` 仍然偏大，承担 DOM 查询、事件绑定、表单读取、渲染调度、保存后刷新和 toast 协调。
- `globals.d.ts` 中部分模块入口仍用 `Function` 表示，应逐步替换为精确函数签名。
- SQLite 已有后端 round trip 测试，但还缺更贴近真实应用状态的前端到后端 smoke。
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
