# 个人智能训练工作台

本项目是一个本地优先的个人训练与饮食工作台，用来管理训练目标、健身房器械、动作库、训练计划、训练反馈、动作级反馈、身体指标、饮食记录、智能建议、周复盘和本地备份。

当前运行形态是 **TypeScript core + Tauri 桌面端 + SQLite 本地存储桥接**。源码不再保留根目录静态 `index.html` 或根目录 `.js` 入口；`src/app/index.html` 是桌面前端源文件，构建后复制到 `dist/desktop/index.html` 供 Tauri 加载。

## 运行

```text
npm.cmd run desktop:dev
npm.cmd run desktop:build:app
```

仍建议定期在应用内“导入导出”页导出 JSON 备份。

## 验证

```text
npm.cmd run check:core
npm.cmd run verify:desktop
cargo test --manifest-path src-tauri/Cargo.toml
npm.cmd run desktop:build:app
```

`verify:desktop` 会运行 TypeScript 检查、生成 JS、JS 语法检查、规则 smoke 测试，并准备 Tauri 前端资源。

## 文档

- [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md)：产品定位和长期方向。
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)：当前功能、代码结构、数据模型和剩余技术债。
- [docs/TESTING.md](docs/TESTING.md)：自动验证、规则 smoke、人工验收和样例数据。
- [docs/DECISIONS.md](docs/DECISIONS.md)：关键产品和架构决策。

## 仓库维护说明

- `package.json`：npm 命令和前端构建开发依赖声明，必须保留。
- `package-lock.json`：锁定 TypeScript 和 Tauri CLI 等依赖版本，必须保留。
- `tsconfig.json`：TypeScript 编译配置，必须保留。
- `scripts/`：当前 3 个脚本分别服务于生成 JS 语法检查、规则 smoke、Tauri 前端资源准备，仍在验证链中使用。
- `node_modules/`、`dist/`、`src-tauri/target/`：本地依赖或构建产物，已在 `.gitignore`，不应提交。需要释放磁盘空间时可以删除，之后重新运行安装或构建命令即可恢复。

## 当前状态

结构性重构已经完成：核心规则、数据主文件、应用入口、存储、导入导出、图表、展示格式化、视图模板和主要状态动作都已进入 TypeScript 源码链路。运行时 JS 只存在于 `dist/generated` 和 `dist/desktop` 构建产物中。

当前更适合继续补产品功能；在新增功能时优先补对应规则 smoke 或人工验收点，避免重新形成隐性耦合。
