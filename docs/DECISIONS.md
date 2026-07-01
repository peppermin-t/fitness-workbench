# 决策记录

本文档记录重构前已经明确的架构和产品决策。后续如果改变这些决策，需要新增决策记录说明原因和影响。

## 决策 1：当前阶段以 Tauri 桌面端作为运行入口

### 决策

当前阶段已经从“根目录 `index.html` 双击运行”推进为“Tauri 桌面端运行”。由于软件尚未对外发布，不再需要保留旧的根目录静态入口。`src/app/index.html` 仅作为桌面前端源文件，由 `scripts/prepare-tauri-frontend.js` 复制到 `dist/desktop/index.html` 后交给 Tauri 加载。

### 明确不做

- 不再把根目录 `index.html` 作为用户入口。
- Phase 5 之前不引入 Tauri；当前已进入 Phase 5，最小 Tauri 壳已接入。
- Phase 6 起已接入 Tauri 环境下的 SQLite 存储桥接。
- 当前不引入 FastAPI。
- 当前不引入 React / Vue。
- 当前不把 TypeScript 构建链作为应用运行前置条件。

### 原因

当前最重要的是稳定功能边界、数据模型、规则边界和验收清单。Tauri 和 SQLite 已完成最小接入，后续应继续收紧类型和数据迁移，而不是继续维护未发布过的旧静态入口。

### 影响

- 用户入口统一为 Tauri 桌面端。
- `src/app/index.html` 是前端源文件，不是直接打开的交付入口。
- 重构优先收紧 TypeScript 类型、数据迁移和桌面端验证。

## 决策 2：v0.2 以本地优先训练工作台为目标

### 决策

v0.2 的目标是让本地训练工作台稳定、可维护、可扩展。

### 明确定位

- 当前不是云端 SaaS。
- 当前不是手机 App。
- 当前不是手表 App。
- 当前不是公开课程平台。
- 当前不是完整营养 App。

### 原因

项目核心价值是用低录入成本把训练计划、场地器械、训练反馈、动作反馈、饮食记录和身体指标串起来，并持续给出可解释、可确认、可执行的个人建议。

### 影响

- 优先补 `WorkoutSession`、`SetLog`、schema、迁移和规则测试。
- 不把云同步、账号系统、手机端、手表端作为当前阶段目标。

## 决策 3：旧 PRODUCT_SPEC 已重命名为 PRODUCT_VISION

### 决策

旧 `PRODUCT_SPEC.md` 不再作为当前执行规格存在。长期愿景统一放在 [PRODUCT_VISION.md](PRODUCT_VISION.md)。

### 文档分工

- 当前执行边界以 [V0_2_SCOPE.md](V0_2_SCOPE.md) 为准。
- 当前代码事实以 [CURRENT_FEATURES.md](CURRENT_FEATURES.md) 为准。
- 数据模型以 [DATA_MODEL_DRAFT.md](DATA_MODEL_DRAFT.md) 为准。
- 后续重构路线以 [REFACTOR_PLAN.md](REFACTOR_PLAN.md) 为准。
- 验收保护以 [SMOKE_CHECKLIST.md](SMOKE_CHECKLIST.md) 为准。

### 原因

原产品规格中包含长期方向，例如 AI 结构化解析、Tauri、SQLite 和 `.xlsx` 导入。这些方向仍然有效，但不能误读为当前 v0.2 的立即执行范围。因此将旧规格文档改为愿景文档，并由新的范围、模型、重构和验收文档承担执行边界。

### 影响

- 后续讨论当前阶段范围时，优先引用 `V0_2_SCOPE.md`。
- 后续判断已有功能时，优先引用 `CURRENT_FEATURES.md`。
- 后续讨论长期个人化方向时，引用 `PRODUCT_VISION.md`。

## 决策 4：AI 不能静默改计划

### 决策

AI 或规则只能生成候选建议，不能静默修改训练计划。

### 约束

- 修改计划必须经过 schema 校验。
- 修改计划必须进入规则引擎或明确的 patch 流程。
- 修改计划必须由用户确认。
- 这个约束在后续 AI 结构化解析阶段仍然成立。

### 原因

训练计划修改会影响实际训练安全和长期进度。用户必须知道建议依据、修改内容和应用时机。

### 影响

- `Revision` 必须保留 `pending` / `applied` 等状态。
- 周复盘候选必须点击确认后应用。
- AI 输出只能作为候选输入，不能绕过本地规则和用户确认。

## 决策 5：下一步正式重构先拆纯业务逻辑

### 决策

下一轮如果进入正式重构，不先改 UI，不先上框架，优先从 `planner.js` 的纯函数拆分开始。

### 第一批目标

- `goal-parser`
- `plan-generator`
- `exercise-feedback-analyzer`

### 同步要求

- 同时补最小测试或示例用例。
- 保持 `window.FitnessPlanner` 旧入口兼容导出；`app.js` 已迁移为使用 `window.FitnessCore.Rules`。
- 不改变页面结构和交互行为。

### 原因

`planner.js` 里已经集中了承载目标解析、计划生成、动作反馈分析、饮食解析、画像、联动信号和周复盘等核心业务规则。先拆纯函数可以降低复杂度，并且比先改 UI 风险更低。

### 影响

- 第一轮正式重构应以行为保持为第一目标。
- 拆分前后必须跑 [SMOKE_CHECKLIST.md](SMOKE_CHECKLIST.md)。
- 拆分后的模块应优先为 TypeScript core 做准备，但不要求立即引入构建链。

## 决策 6：本软件 primarily 是个人定制训练工作台

### 决策

本软件首先服务单个用户的长期训练决策，是个人定制训练工作台，不以泛用商业健身 SaaS 为目标。

### 当前核心

当前核心是：

- 健身房力量训练。
- 出差训练和不同场地器械切换。
- 饮食记录。
- 身体指标。
- 训练整体反馈。
- 动作级反馈。
- 计划调整和周复盘。

### 长期个人化方向

长期设计需要考虑用户真实运动组合，包括：

- 间歇性徒步。
- 越野跑入门或周末山野活动。
- 滑雪季腿部、核心和体能维护。
- 后续可能的攀岩基础训练。

这些方向是长期画像、目标模板和训练周期扩展方向，不纳入当前 v0.2 必做范围。

### 不做范围

当前阶段不做：

- 户外路线管理。
- 越野赛事管理。
- 运动社交。
- 完整体能平台。
- 医学康复处方。
- 泛用健身 SaaS。

### 影响

- v0.2 仍以力量训练工作台稳定化为主。
- 户外、滑雪、攀岩相关内容只作为长期愿景和未来模型扩展参考。
- 不因为个人化方向引入当前阶段的功能膨胀。

## 决策 7：长期技术路线是 TypeScript core + Tauri 桌面端 + SQLite

### 决策

长期技术路线不是永远停留在纯 HTML / JS。当前已经进入 TypeScript core、Tauri 桌面端和 SQLite 本地数据库路线。

### 路线

- 业务 core 应逐步 TypeScript 化；Phase 4 已完成最小迁移。
- 桌面端优先选择 Tauri。
- 长期本地数据存储优先考虑 SQLite。
- JSON 仍应保留为备份、导入导出和迁移格式。

### 迁移顺序

迁移顺序不能反过来，必须先稳定模型、规则、迁移和测试，再上 Tauri / SQLite：

1. 先完成 `WorkoutSession`、`ExerciseLog`、`SetLog` 等数据模型。
2. 再完成 `schemaVersion` 迁移和 JSON 导入导出保护。
3. 再迁移 TypeScript core。已完成最小迁移，后续继续收紧类型。
4. 再封装 Tauri 桌面端。
5. 最后迁移 SQLite 作为运行时主存储。

### 当前阶段边界

- 当前不再保留根目录 `index.html` 双击入口。
- 当前已引入最小 npm / TypeScript 检查链，但只用于 core 构建和类型检查。
- 当前已接入最小 Tauri 壳。
- 当前已接入 Tauri 环境下的 SQLite 存储桥接，并继续保留 JSON 备份。

### 原因

当前最重要的是把训练计划、训练反馈、动作反馈、身体指标、饮食记录、建议和周复盘的数据关系固定下来。技术栈迁移应服务于这些模型和规则，而不是提前制造新的复杂度。

### Phase 4 当前结果

- `src/core/models/index.d.ts` 提供核心模型声明。
- `src/core/types/globals.d.ts` 固定浏览器全局对象声明。
- `src/core/rules/*.ts` 和 `src/app/storage/state-normalizer.ts` 作为 TypeScript core 源文件。
- 同名 `.js` 文件仍作为 Tauri 前端实际加载的浏览器脚本输出，`src/app/index.html` 不直接加载 `.ts`。
- `// @ts-nocheck` 过渡措施已移除；当前 `npm.cmd run check:core` 会直接检查 TypeScript 源文件。

### Phase 5 当前结果

- `src-tauri/` 提供 Tauri v2 最小桌面壳。
- `scripts/prepare-tauri-frontend.js` 负责生成 `dist/desktop`，避免把仓库根目录或 `node_modules` 直接作为桌面前端资源。
- `desktop:dev` 和 `desktop:build` 已作为 npm 脚本存在。
- 本机运行或打包 Tauri 仍需要 Rust / Cargo 和系统依赖。

### Phase 6 当前结果

- Tauri Rust 侧新增 `load_app_state` / `save_app_state` 命令。
- 桌面端状态会写入 SQLite 完整 JSON 快照，并镜像 `goals`、`gyms`、`exercises`、`training_plans`、`workout_sessions`、`exercise_logs`、`set_logs`、`body_metrics`、`nutrition_logs`、`advice`、`revisions` 等表。
- 普通浏览器仍使用 localStorage。
- JSON 仍是备份 / 导入导出和迁移格式。

### 影响

- 后续路线文档应把 TypeScript core、Tauri 和 SQLite 写成长期路线中的明确阶段。
- v0.2 讨论范围时，仍以 [V0_2_SCOPE.md](V0_2_SCOPE.md) 和 [REFACTOR_PLAN.md](REFACTOR_PLAN.md) 的当前阶段边界为准。
- 后续 SQLite 工作应先完成本机 `desktop:build` 验证，再逐步把读取逻辑从完整 JSON 快照迁移到细粒度 SQL 查询。
