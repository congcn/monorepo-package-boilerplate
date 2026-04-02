# 架构设计文档

本文档记录各阶段每一步的架构设计思路与技术选型依据。

---

## 阶段 1 — monorepo 基础设施

### 1.1 monorepo 基础

**目录结构**

```
monorepo-package-boilerplate/
├── packages/        # 子包（各组件库）
│   └── .gitkeep
├── playground/      # 本地调试 demo（Vite 应用）
├── docs/            # 文档站（VitePress）
├── scripts/         # 构建、发布脚本
│   └── .gitkeep
├── package.json     # 根包（private: true）
├── pnpm-workspace.yaml
├── .npmrc
└── .nvmrc / .node-version
```

**`.gitkeep` 的作用**

git 只跟踪文件，不跟踪空目录。如果一个目录内没有任何文件，`git add` 不会将其纳入版本控制，克隆仓库后该目录不存在。

`.gitkeep` 是一个约定俗成的空占位文件（非 git 内置功能，名称无强制要求），放入空目录后 git 就能跟踪它，从而保留目录结构。

适用场景：`packages/`、`scripts/` 等目录在项目初始阶段暂无内容，但目录本身是项目结构的一部分，需要随仓库一起提交。当目录内有真实文件后，`.gitkeep` 即可删除。

**技术选型：pnpm workspaces**

| 方案 | 说明 |
|------|------|
| pnpm workspaces（选用） | 原生 monorepo 支持，符号链接替代真实安装，磁盘占用小；严格隔离依赖，不允许访问未声明的包（禁止幽灵依赖） |
| npm/yarn workspaces（未选用） | 默认提升所有依赖到根目录，幽灵依赖问题难以发现 |

**根 package.json 设计要点**

- `"private": true`：防止根包被意外发布到 npm
- `"engines"` 字段：锁定 `node>=20` 和 `pnpm>=9`，保证团队环境一致
- `"packageManager"` 字段：配合 corepack，自动使用指定版本的 pnpm，无需全局安装

**`.npmrc` 关键配置**

| 配置项 | 值 | 作用 |
|--------|-----|------|
| `shamefully-hoist` | `false` | 保持严格隔离，禁止幽灵依赖 |
| `auto-install-peers` | `true` | 自动安装 peerDependencies，减少手动操作 |
| `link-workspace-packages` | `true` | workspace 内包优先使用本地链接版本 |
| `prefer-workspace-packages` | `true` | 确保本地包始终优先于 registry |

---

### 1.2 TypeScript 配置

**分层继承策略**

根目录 `tsconfig.base.json` 定义全局严格规则，各子包通过 `"extends": "../../tsconfig.base.json"` 继承，按需覆盖 `paths`、`outDir` 等字段。

| 配置 | 值 | 理由 |
|------|----|------|
| `strict` | `true` | 开启全部严格检查（strictNullChecks、noImplicitAny 等） |
| `moduleResolution` | `Bundler` | 对齐 Vite/Rollup 的模块解析行为，支持 `exports` 字段 |
| `target` | `ES2020` | 覆盖现代浏览器，避免过多 polyfill |
| `declaration` | `true` | 构建时同步输出 `.d.ts` |
| `declarationMap` | `true` | 生成 `.d.ts.map`，IDE 跳转定义能直达源码 |
| `composite` | `true`（子包） | 配合 `tsc --build` 实现增量编译 |

---

### 1.3 代码规范

**工具分工**

| 工具 | 职责 |
|------|------|
| ESLint | 代码质量检查（逻辑错误、最佳实践），使用 `@typescript-eslint` flat config（ESLint v9+） |
| Prettier | 格式化（空格、换行、引号），不与 ESLint 规则重叠 |
| `eslint-config-prettier` | 关闭 ESLint 中与 Prettier 冲突的格式化规则，放在 extends 最后 |
| `.editorconfig` | IDE 级别的基础格式约束，跨编辑器保持一致 |

**原则**：ESLint 负责"写法对不对"，Prettier 负责"格式好不好"，两者职责不重叠。

---

### 1.4 Git 提交规范

**工具链**

| 工具 | 触发时机 | 作用 |
|------|---------|------|
| Husky | 安装 git hooks | 管理 `.husky/` 下的 hook 脚本 |
| lint-staged | `pre-commit` | 只对暂存区文件执行 lint/format，速度远快于全量扫描 |
| Commitlint | `commit-msg` | 校验提交信息符合 Conventional Commits 规范 |

**Conventional Commits 类型**

```
feat     新功能
fix      Bug 修复
docs     文档变更
style    格式（不影响逻辑）
refactor 重构（不新增功能，不修复 bug）
test     测试相关
chore    构建/工具链/依赖更新
perf     性能优化
```

**设计决策**：lint-staged 只检查暂存文件，避免大型 monorepo 中全量 lint 耗时过长破坏开发体验；Commitlint 保证提交信息可被 Changesets 和 CHANGELOG 工具正确解析。

---

### 1.5 构建基础设施

**技术选型**

| 工具 | 用途 | 理由 |
|------|------|------|
| Rollup | 库打包 | 产物干净，Tree-shaking 优秀，适合库（非应用）打包 |
| Vite | playground 开发服务器 | 基于 Rollup，HMR 极快 |
| `vite-plugin-dts` | 生成 `.d.ts` | 从源码直接生成类型声明，无需单独跑 `tsc` |
| `tsx` | 运行构建脚本 | 无需编译直接运行 TypeScript 脚本 |

**输出格式**

```
dist/
├── index.mjs        # ESM（现代打包工具 / Node ESM）
├── index.cjs        # CJS（Node CommonJS / 旧版构建工具）
├── index.iife.js    # IIFE（<script> 标签直接引入）
├── index.d.ts       # TypeScript 类型声明入口
└── index.d.ts.map   # 类型声明 Source Map
```

**子入口（按模块拆分）**：通过 `package.json` 的 `exports` 字段声明子路径，支持 `import { Foo } from 'my-lib/foo'`，实现原生按需引入。

---

### 1.6 版本与发布

**技术选型：Changesets**

| 方案 | 说明 |
|------|------|
| `@changesets/cli`（选用） | 每次 PR 附带 `.changeset/*.md` 描述变更，合并后统一执行 `changeset version` 更新版本号和 CHANGELOG，与 pnpm workspaces 原生集成 |
| `lerna version`（未选用） | 历史包袱较重，配置繁琐 |
| 手动维护 CHANGELOG（未选用） | 易出错，无法与 git 历史关联 |

**发布流程**

```
开发 → PR（附带 changeset 文件）→ merge main
→ changeset version（更新版本号 + CHANGELOG）
→ pnpm build → changeset publish（推送 npm）
```

---

### 1.7 CI/CD（可选）

**GitHub Actions 工作流设计**

| Job | 触发条件 | 执行内容 |
|-----|---------|---------|
| `ci` | PR 创建/更新 | lint + typecheck + test |
| `release` | push to `main` | build + changeset publish |

**要点**：
- `actions/cache` 缓存 pnpm store，加速安装
- `release` 依赖 `ci` 通过，防止破坏性变更发布到 npm
- npm 发布使用 `NPM_TOKEN` secret

---

## 阶段 2 — 示例包（packages/my-lib）

### 2.1 包初始化

**子包 package.json 设计**

```json
{
  "name": "my-lib",
  "version": "0.0.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"]
}
```

`exports` 字段同时声明所有格式，构建工具自动选取最优格式；`files` 字段限制 npm 发布内容，不包含源码。

### 2.2 源码结构

```
packages/my-lib/
├── src/
│   ├── index.ts        # 公开 API 入口（仅 re-export）
│   └── ...
├── package.json
├── tsconfig.json       # extends ../../tsconfig.base.json
└── vite.config.ts      # 或 rollup.config.ts
```

入口文件只做 re-export，不包含逻辑，便于 Tree-shaking。

### 2.3 单元测试

Vitest 配置继承根目录，各子包可单独运行 `vitest run`，也可通过根目录 `pnpm test` 统一执行（`--filter` 或 `--workspace`）。

### 2.4 playground 联调

`playground/package.json` 中通过 `workspace:*` 协议引用子包：

```json
{
  "dependencies": {
    "my-lib": "workspace:*"
  }
}
```

pnpm 将其解析为本地符号链接，修改源码后无需重新安装，Vite HMR 可直接感知变更。

---

## 阶段 3 — 文档站

**技术选型：VitePress**

| 方案 | 说明 |
|------|------|
| VitePress（选用） | 基于 Vite，支持 Vue 组件嵌入，构建产物为静态 HTML，适合部署到 GitHub Pages |
| Storybook（未选用） | 更适合 UI 组件交互展示，配置复杂度高，偏重 React/Vue 生态 |
| Docusaurus（未选用） | React 生态，与本项目 TS-first 风格契合度低于 VitePress |

---

## 关键设计原则

1. **与业务完全解耦**：脚手架不含任何业务逻辑，`packages/` 下仅放示例包
2. **按子路径拆分**：`exports` 字段 + 独立 chunk，支持原生按需引入
3. **完整 TypeScript 类型**：所有公开 API 有类型声明，`declaration` + `declarationMap` 同步输出
4. **复用优先**：新组件库直接 fork/clone 此模板，无需额外配置
