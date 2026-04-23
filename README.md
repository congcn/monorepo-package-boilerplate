# monorepo-package-boilerplate

一个面向 npm 包 / 组件库场景的 `monorepo` 模板仓库。

它提供了一套从开发、测试、构建、联调、文档到版本发布的完整基础设施，适合用作组件库、工具库或多包项目的起点，而不是每次新建项目时重复搭建工程底座。

## 项目定位

这个模板主要解决的是“包工程基础设施”问题，而不是业务实现问题。

你可以直接基于它开始：

- 多包管理
- TypeScript 严格类型约束
- npm 包构建与导出
- 本地 playground 联调
- 文档站维护
- Changesets 版本管理与发布
- GitHub Actions 持续集成与自动发布

## 核心能力

- `pnpm workspaces` 管理 monorepo
- `TypeScript` 严格模式与分层配置继承
- `ESLint + Prettier + EditorConfig` 统一代码规范
- `Husky + lint-staged + Commitlint` 规范提交流程
- `Rollup` 输出 `ESM / CJS / IIFE / d.ts`
- `Vitest` 统一单元测试入口与覆盖率统计
- `Vite` 驱动本地 `playground` 联调
- `VitePress` 构建文档站
- `Changesets` 管理版本与 changelog
- `GitHub Actions` 执行 CI / Release / Docs 部署

## 目录结构

```text
package-template/
├── packages/              # 子包目录（由脚手架 pnpm create:package 生成）
├── playground/            # 本地联调应用（Vite）
├── docs/                  # 文档站（VitePress）
├── scripts/               # 构建脚本
├── .changeset/            # Changesets 配置与变更记录
├── .github/workflows/     # CI / 发布 / 文档部署工作流
├── rollup.config.base.mjs # 根级 Rollup 配置工厂
├── tsconfig.base.json     # 根级 TypeScript 基础配置
├── eslint.config.mjs      # ESLint flat config
└── prettier.config.mjs    # Prettier 配置
```

## 技术选型

| 领域         | 方案                                 |
| ------------ | ------------------------------------ |
| 包管理       | `pnpm workspaces`                    |
| 语言         | `TypeScript`                         |
| 代码规范     | `ESLint`、`Prettier`、`EditorConfig` |
| Git 提交规范 | `Husky`、`lint-staged`、`Commitlint` |
| 库构建       | `Rollup`                             |
| 脚本运行     | `tsx`                                |
| 单元测试     | `Vitest`                             |
| 本地联调     | `Vite`                               |
| 文档站       | `VitePress`                          |
| 版本发布     | `Changesets`                         |
| CI/CD        | `GitHub Actions`                     |

## 环境要求

- Node.js `>=20.0.0`
- pnpm `>=9.0.0`

建议使用仓库中的 `.node-version` / `.nvmrc` 保持本地环境一致。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建全部包

```bash
pnpm build
```

### 3. 启动 playground

```bash
pnpm dev:playground
```

如果你需要联调本地包的构建输出，建议同时开启该包的 watch：

```bash
pnpm -F <包名> build --watch
```

### 4. 启动文档站

```bash
pnpm docs:dev
```

## 常用命令

| 命令                           | 说明                                     |
| ------------------------------ | ---------------------------------------- |
| `pnpm build`                   | 构建所有包                               |
| `pnpm dev`                     | 启动 `playground`                        |
| `pnpm -F <包名> build --watch` | 以 watch 模式构建指定包                  |
| `pnpm dev:playground`          | 启动本地联调应用                         |
| `pnpm docs:dev`                | 启动文档站开发环境                       |
| `pnpm docs:build`              | 构建文档站                               |
| `pnpm lint`                    | 执行 ESLint 检查                         |
| `pnpm lint:fix`                | 自动修复可修复的 lint 问题               |
| `pnpm format`                  | 格式化仓库文件                           |
| `pnpm test`                    | 运行单元测试                             |
| `pnpm test:watch`              | 以 watch 模式运行测试                    |
| `pnpm test:coverage`           | 运行测试、校验覆盖率阈值并生成覆盖率报告 |
| `pnpm typecheck`               | 执行 TypeScript 类型检查                 |
| `pnpm changeset`               | 创建变更记录                             |
| `pnpm version-packages`        | 根据 changeset 更新版本与 changelog      |
| `pnpm release`                 | 构建并发布包                             |
| `pnpm clean`                   | 清理构建产物                             |

## 本地联调机制

这个模板的联调方式不是直接把 `playground` alias 到源码，而是走真实包消费链路：

1. `playground` 通过 `workspace:*` 依赖本地包
2. 本地包通过 `exports` 指向 `dist` 构建产物
3. 开发时使用 `rollup -w` 持续更新 `dist`
4. `playground` 作为真实 consumer 感知更新

这样能更早验证“包被消费”这条链路本身，而不仅仅是源码能否被编译。

## 新增一个包的推荐流程

不再需要手动复制粘贴！我们提供了自动化的包生成脚手架：

```bash
pnpm create:package --name <包名> --template <模板类型>
```

支持的模板类型（对应不同业务场景）：

- `utils`: 纯逻辑工具包
- `component`: 框架无关 DOM 组件包
- `react`: React 组件包
- `vue`: Vue 组件包
- `cesium`: Cesium 插件扩展包

生成后，脚手架会自动完成 `package.json` 的导出配置、`rollup.config.mjs` 构建接入以及基础的测试文件。详情请阅读文档站中的 **多场景包开发** 指南。

## 文档站

文档站基于 `VitePress`，当前约定分为三层：

- `docs/index.md`：项目首页与模板定位
- `docs/guide/`：接入与开发指南
- `docs/api/`：API 结构与公开能力说明

当前 `base` 路径不再依赖 `NODE_ENV` 判断，而是统一通过 `DOCS_BASE` 环境变量注入：

- 本地开发默认使用 `/`
- CI / GitHub Pages 构建时通过 workflow 显式传入部署子路径
- 配置会自动补齐末尾 `/`，减少路径拼接错误

这种方式比依赖运行环境推断更稳定，也更适合模板仓库在不同仓库名、不同 Pages 路径下复用。

推荐新增包后同步补充对应文档，尽量让文档结构与包的导出结构保持一致。

## 版本与发布

项目使用 `Changesets` 管理版本与发布流程。

### 基本流程

1. 开发功能或修复问题
2. 执行 `pnpm changeset` 记录变更
3. 提交 PR 并合并到 `main`
4. 执行 `pnpm version-packages` 更新版本号和 `CHANGELOG.md`
5. 执行 `pnpm release` 发布到 npm

### 当前发布策略

- 根包 `private: true`，不会被误发到 npm
- 子包可独立发布
- 默认以 `main` 作为发布基线分支
- 内部依赖变更时按 `patch` 策略联动更新

## CI/CD

仓库当前已经包含三类工作流：

- `ci.yml`：执行 `lint`、`typecheck`、`test:coverage`、`build`
- `release.yml`：基于 Changesets 创建版本 PR 或发布 npm 包
- `docs.yml`：构建并部署文档站

这意味着模板不仅能本地开发，也已经具备基础的团队协作与自动交付能力。

## 适用场景

适合：

- 组件库模板
- 工具库模板
- 多包 npm 项目
- 需要文档站和发布流程的前端基础设施仓库

不适合：

- 单一业务应用项目
- 只需要一个简单脚本包且没有 monorepo 需求的场景

## 设计原则

- 与业务解耦：模板只提供工程底座，不绑定具体业务
- 严格类型优先：保证包接口与消费体验稳定
- 真实消费链路优先：联调时尽量模拟真实 npm 包使用方式
- 复用优先：新增子包时尽可能复用现有配置与结构
- 约定优于重复配置：公共策略放根目录，子包只做最小覆写

## 进一步阅读

如果你想了解这套模板为什么这样设计、每个阶段解决了什么问题，可以继续阅读文档站中的 **工程溯源** 章节：

- [阶段一：Monorepo 基础设施](./docs/internals/phase-1-monorepo.md)
- [阶段二：示例包结构](./docs/internals/phase-2-package.md)
- [阶段三：文档站](./docs/internals/phase-3-docs.md)
- [阶段四：多场景脚手架](./docs/internals/phase-4-scenarios.md)

## License

[MIT](./LICENSE)
