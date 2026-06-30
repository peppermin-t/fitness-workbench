# 个人智能训练工作台

这是一个本地电脑端训练与饮食工作台，用来替代教练用 Excel 管理训练计划的方式，并逐步补上动作级反馈、饮食自然语言记录、身体指标跟踪和计划优化建议。

当前仍是本地优先静态 Web 工作台。本阶段不引入 React / Vue / Tauri / SQLite / FastAPI，不破坏 `index.html` 双击运行；重构前先冻结功能和验收路径。

长期技术路线是 TypeScript core + Tauri 桌面端 + SQLite 本地数据库；当前已经完成 TypeScript core 的最小迁移，但运行入口仍然是静态 JS，Tauri 和 SQLite 仍不是当前阶段立即执行项。

## 运行方式

直接双击打开 `index.html` 即可使用。

当前版本是零依赖静态应用，数据保存在浏览器本地存储中。建议定期在“导入导出”页导出 JSON 备份。

如需检查 TypeScript core，可在命令行运行：

```text
npm.cmd run check:core
npm.cmd run build:core
npm.cmd run verify:phase5
```

构建只用于生成和检查 core 的 JS 兼容输出，不改变 `index.html` 的双击运行方式。`verify:phase5` 用于进入 Tauri 封装前的本地准备检查。

## 文档导航

- [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md)：产品愿景、个人定制定位和长期方向。
- [docs/CURRENT_FEATURES.md](docs/CURRENT_FEATURES.md)：当前代码实际已有功能。
- [docs/V0_2_SCOPE.md](docs/V0_2_SCOPE.md)：当前阶段 v0.2 的功能边界。
- [docs/DATA_MODEL_DRAFT.md](docs/DATA_MODEL_DRAFT.md)：当前和建议的数据模型。
- [docs/REDUNDANCY_AND_BOUNDARY_REVIEW.md](docs/REDUNDANCY_AND_BOUNDARY_REVIEW.md)：当前冗余、边界混乱和风险。
- [docs/REFACTOR_PLAN.md](docs/REFACTOR_PLAN.md)：后续重构路线。
- [docs/PHASE5_PREPARED.md](docs/PHASE5_PREPARED.md)：进入 Tauri 桌面端封装前的准备状态和检查命令。
- [docs/SMOKE_CHECKLIST.md](docs/SMOKE_CHECKLIST.md)：重构前后必须跑通的人工验收清单。
- [docs/RULE_TEST_CASES.md](docs/RULE_TEST_CASES.md)：拆分规则逻辑前固定的核心输入输出样例。
- [docs/DECISIONS.md](docs/DECISIONS.md)：关键架构和产品决策记录。
- [docs/SAMPLE_DATA_GUIDE.md](docs/SAMPLE_DATA_GUIDE.md)：重构前样例备份数据准备说明。

规则保护层：

- 可直接用浏览器打开 [tests/rules-smoke.html](tests/rules-smoke.html)，运行 12 个无依赖规则 smoke 测试。
- 可运行 `npm.cmd run smoke:rules`，在命令行等价执行同一组规则用例。
- 可在“导入导出”页导入 [docs/sample-data/manual-smoke-baseline.json](docs/sample-data/manual-smoke-baseline.json)，作为重构前人工验收基线。

## 当前状态

- 阶段 0：本地工作台 MVP，已完成
- 阶段 1：动作级训练反馈，已完成
- 阶段 2：饮食自然语言记录，已完成
- 阶段 3：本地规则建议引擎，已完成
- 阶段 3.5：动作/饮食画像与首页联动，已完成
- 阶段 4：周复盘与训练/饮食/身体指标联动，已完成
- 阶段 5：长期画像与提前提醒，已完成

## 已有功能

- 目标设定与自然语言目标解析
- 健身房 / 场地器械管理
- 动作库与中英双语动作/器械名称
- 扩充常见商业健身房动作/器械候选，包括上斜推胸、肩推、高位下拉、高位划船、T 杠划船、EZ 杠弯举、二头弯举机等
- 按当前器械范围生成训练计划与替代动作
- 身体指标记录与趋势图
- 训练日整体反馈
- 动作级训练反馈、历史回看与长期画像
- 饮食自然语言记录、营养估算、趋势图与长期画像
- 首页联动建议
- 训练前提醒
- 饮食前提醒
- 智能教练页周复盘
- 计划级调整候选与应用记录
- CSV 导入 / 导出
- JSON 备份 / 恢复

## 下一步

Phase 4 TypeScript core 最小迁移已完成，仓库已补齐 Phase 5 前准备检查。下一步可以开始 Phase 5 Tauri 桌面端封装设计，但正式实施前应先运行 `npm.cmd run verify:phase5`，并按 `docs/PHASE5_PREPARED.md` 确认静态 Web fallback 可用。
