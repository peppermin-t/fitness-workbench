# 决策记录

本文档只保留长期仍然有效的产品和架构决策。阶段性执行细节不再单独记录。

## 1. 本软件是个人定制训练工作台

本软件 primarily 服务单个用户的长期训练决策，不以泛用商业健身 SaaS 为目标。

当前核心场景是力量训练、出差训练、饮食记录、身体指标、动作反馈和计划调整。长期可以考虑徒步、越野跑、滑雪季维护和攀岩基础训练，但这些只属于个人画像和目标模板扩展方向，不进入当前核心范围。

## 2. 当前运行形态是 Tauri 桌面端

旧的根目录 `index.html` 双击入口已经移除。当前入口是 Tauri 桌面端：

- `src/app/index.html` 是前端源文件。
- `src/**/*.ts` 是源代码。
- `dist/generated` 是 TS 编译输出。
- `dist/desktop` 是 Tauri 加载的前端资源。

根目录和 `src` 下不再提交 `.js` 源码。浏览器和 Tauri WebView 仍然运行 JS，因此 `dist/generated` 和 `dist/desktop` 中存在 JS 是正常构建产物，不是源代码双份维护。

## 3. 长期技术路线是 TypeScript core + Tauri + SQLite

项目不是临时停留在纯 HTML / JS。长期技术路线已经明确：

1. TypeScript core。
2. Tauri 桌面端。
3. SQLite 本地数据库。

迁移顺序不能反过来。必须先稳定模型、规则、迁移和测试，再扩大存储和平台能力。

## 4. JSON 仍是安全网

SQLite 是桌面运行时本地存储路径，但 JSON 必须继续作为备份、恢复和迁移格式保留。

任何 SQLite schema 或状态迁移失败都不应导致用户数据不可恢复。

## 5. AI 不能静默修改训练计划

AI 或规则只能生成候选建议。修改训练计划必须经过：

- schema 校验；
- 规则引擎处理；
- 用户显式确认；
- revision 记录。

这个约束在后续 AI 结构化解析阶段仍然成立。

## 6. 文档不再按阶段膨胀

重构阶段文档已经收口。后续只维护：

- `PRODUCT_VISION.md`
- `ARCHITECTURE.md`
- `TESTING.md`
- `DECISIONS.md`

除非有长期价值，不再新增一次性 Phase 文档。

## 7. 当前质量提升方向

已完成：

- `globals.d.ts` 已移除 `Function` 型全局边界，改为 `UnknownFn`，调用处按模块补类型桥接。
- `src/app/main.ts` 已抽出 DOM 查询和 toast 控制到 `src/app/ui/dom-utils.ts`。
- SQLite 已新增基于真实样例 JSON 的后端状态镜像 smoke。

后续仍可继续：

- 将高频全局模块从 `UnknownFn` 进一步收紧为精确函数签名。
- 将 `src/app/main.ts` 的事件绑定和表单读取继续拆到更小的 UI 协调模块。
- 在 Tauri command 层补更完整的端到端存储测试。
