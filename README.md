# monorepo-package-boilerplate

A modern monorepo boilerplate for building component libraries and npm packages.
一个面向组件库与 npm 包开发的现代化 Monorepo 模板。

核心工具链：`pnpm workspaces` · `TypeScript` · `Rollup` · `Vitest` · `VitePress` · `Changesets` · `GitHub Actions`

支持场景：`utils` · `component` · `react` · `vue` · `cesium`

在线文档：[https://congyao1993.github.io/monorepo-package-boilerplate/](https://congyao1993.github.io/monorepo-package-boilerplate/)

## 项目定位

这个模板解决的是“包工程基础设施”问题，适合作为团队统一起点：

- 多包管理与依赖协作
- TypeScript 严格类型约束
- npm 包构建与产物导出
- 本地 playground 联调
- 文档站点维护
- Changesets 版本管理与发布
- GitHub Actions 持续集成与自动发布

## 目录结构

```text
monorepo-package-boilerplate/
├─ packages/               # 子包目录（通过脚手架生成）
├─ playground/             # 本地联调应用（Vite）
├─ docs/                   # 文档站点（VitePress）
├─ scripts/                # 自动化脚本与模板
├─ .changeset/             # Changesets 配置与变更记录
├─ .github/workflows/      # CI / Release / Docs 工作流
├─ rollup.config.base.mjs  # Rollup 基础配置工厂
├─ tsconfig.base.json      # TypeScript 基础配置
└─ vitest.config.ts        # Vitest 根配置
```

## 环境要求

- Node.js `>=20`
- pnpm `>=9`

建议使用仓库内的 `.node-version` / `.nvmrc` 保持一致。

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 构建全部包

```bash
pnpm build
```

3. 启动 playground

```bash
pnpm dev:playground
```

4. 启动文档站点

```bash
pnpm docs:dev
```

## 常用命令

- `pnpm build`：构建所有子包
- `pnpm dev`：启动 playground
- `pnpm docs:dev`：启动文档开发服务器
- `pnpm docs:build`：构建文档站点
- `pnpm lint` / `pnpm lint:fix`：代码规范检查与修复
- `pnpm test` / `pnpm test:coverage`：运行测试与覆盖率
- `pnpm typecheck`：工作区类型检查
- `pnpm create:package --name <name> --template <type>`：创建新包
- `pnpm changeset`：创建变更记录
- `pnpm version-packages`：根据 changeset 升级版本
- `pnpm release`：构建并发布

## 创建新包

```bash
pnpm create:package --name <包名> --template <模板类型>
```

模板类型：

- `utils`：工具函数包
- `component`：框架无关组件包
- `react`：React 组件包
- `vue`：Vue 组件包
- `cesium`：Cesium 扩展包

## CI/CD

工作流包含：

- `ci.yml`：`lint`、`typecheck`、`test:coverage`、`build`、模板校验
- `release.yml`：Changesets 版本 PR 或 npm 发布
- `docs.yml`：文档构建与 GitHub Pages 部署

## License

[MIT](./LICENSE)
