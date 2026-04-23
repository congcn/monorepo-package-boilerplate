# 阶段一：Monorepo 基础设施

> **目标**：搭建一个严格隔离依赖、统一规范、自动化质量守门的 Monorepo 工程底座。

这是整个项目的地基，后续所有包、文档站、CI/CD 都建在上面。

---

## 1.1 初始化项目结构

### 为什么用 pnpm workspaces？

| 方案                          | 说明                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| **pnpm workspaces**（选用）   | 原生 monorepo 支持，符号链接替代真实安装，磁盘占用小；**严格隔离依赖**，禁止幽灵依赖 |
| npm/yarn workspaces（未选用） | 默认把所有依赖提升到根目录，幽灵依赖问题难以发现                                     |

### 操作步骤

```bash
# 1. 创建根目录并初始化
mkdir monorepo-package-boilerplate
cd monorepo-package-boilerplate
git init
pnpm init
```

创建 **目录骨架**：

```
monorepo-package-boilerplate/
├── packages/        # 子包（各组件库）
├── playground/      # 本地调试 demo（Vite 应用）
├── docs/            # 文档站（VitePress）
├── scripts/         # 构建、发布脚本
├── package.json
└── pnpm-workspace.yaml
```

> **为什么需要 `.gitkeep`？**
> Git 只追踪文件，不追踪空目录。在 `packages/`、`scripts/` 等暂时为空的目录里放一个 `.gitkeep` 占位文件，让 git 能记录这些目录的存在。等目录内有真实文件后可以删掉。

```bash
# 占位空目录
touch packages/.gitkeep
touch scripts/.gitkeep
```

创建 **`pnpm-workspace.yaml`**，声明工作区范围：

```yaml
packages:
  - 'packages/*'
  - 'playground'
  - 'docs'
```

### 根 `package.json` 设计要点

```json
{
  "name": "monorepo-package-boilerplate",
  "version": "0.0.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- `"private": true` — 防止根包被意外发布到 npm
- `"engines"` — 锁定 Node/pnpm 版本，保证团队环境一致
- `"packageManager"` — 配合 corepack，自动启用指定版本的 pnpm，无需全局安装

### `.npmrc` 关键配置

```ini
shamefully-hoist=false
auto-install-peers=true
link-workspace-packages=true
prefer-workspace-packages=true
```

| 配置项                           | 作用                                    |
| -------------------------------- | --------------------------------------- |
| `shamefully-hoist=false`         | 保持严格隔离，禁止幽灵依赖              |
| `auto-install-peers=true`        | 自动安装 peerDependencies，减少手动操作 |
| `link-workspace-packages=true`   | workspace 内包优先使用本地链接版本      |
| `prefer-workspace-packages=true` | 确保本地包始终优先于 registry           |

### Node 版本文件

```bash
# .node-version 和 .nvmrc 都写入版本号，兼容 nvm/fnm/volta 等工具
echo "20" > .node-version
echo "20" > .nvmrc
```

---

## 1.2 TypeScript 配置

### 分层继承策略

根目录放 `tsconfig.base.json`，定义全局严格规则。各子包通过 `"extends": "../../tsconfig.base.json"` 继承，只覆盖自己需要的字段（`rootDir`、`outDir` 等）。

```bash
pnpm add -D typescript -w
```

**`tsconfig.base.json`**：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

根目录的 `tsconfig.json`（用于 IDE 整体识别，不做实际编译）：

```json
{
  "extends": "./tsconfig.base.json",
  "include": ["scripts", "rollup.config.base.mjs"]
}
```

**关键配置说明：**

| 配置               | 值        | 理由                                                   |
| ------------------ | --------- | ------------------------------------------------------ |
| `strict`           | `true`    | 开启全部严格检查（strictNullChecks、noImplicitAny 等） |
| `moduleResolution` | `Bundler` | 对齐 Vite/Rollup 的模块解析行为，支持 `exports` 字段   |
| `declaration`      | `true`    | 构建时同步输出 `.d.ts`                                 |
| `declarationMap`   | `true`    | 生成 `.d.ts.map`，IDE 跳转定义能直达源码               |

---

## 1.3 代码规范

### 工具分工

| 工具                     | 职责                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------- |
| ESLint                   | 代码质量检查（逻辑错误、最佳实践），使用 `@typescript-eslint` flat config（ESLint v9+） |
| Prettier                 | 格式化（空格、换行、引号），不与 ESLint 规则重叠                                        |
| `eslint-config-prettier` | 关闭 ESLint 中与 Prettier 冲突的格式化规则，放在 extends 最后                           |
| `.editorconfig`          | IDE 级别的基础格式约束，跨编辑器保持一致                                                |

**原则**：ESLint 负责"写法对不对"，Prettier 负责"格式好不好"，两者职责不重叠。

```bash
pnpm add -D eslint typescript-eslint eslint-config-prettier prettier -w
```

**`eslint.config.mjs`**：

```js
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.vitepress/dist/**',
      '**/.vitepress/cache/**',
    ],
  },
  tseslint.configs.recommended,
  eslintConfigPrettier,
)
```

**`prettier.config.mjs`**（示例配置）：

```js
export default {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'all',
}
```

**`.prettierignore`**：

```
dist/
node_modules/
```

**`.editorconfig`**：

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

### VS Code 工作区配置

**`.vscode/settings.json`**（纳入版本控制，保证团队一致）：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.useFlatConfig": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

> `eslint.useFlatConfig` 需显式声明，因为 ESLint VS Code 插件默认仍按旧 `.eslintrc` 模式查找配置文件。

**`.vscode/extensions.json`**（推荐插件，新成员 clone 后自动提示安装）：

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "EditorConfig.EditorConfig"
  ]
}
```

---

## 1.4 Git 提交规范

### 工具链

| 工具        | 触发时机       | 作用                                               |
| ----------- | -------------- | -------------------------------------------------- |
| Husky       | 安装 git hooks | 管理 `.husky/` 下的 hook 脚本                      |
| lint-staged | `pre-commit`   | 只对暂存区文件执行 lint/format，速度远快于全量扫描 |
| Commitlint  | `commit-msg`   | 校验提交信息符合 Conventional Commits 规范         |

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional -w

# 初始化 husky（会创建 .husky/ 目录）
pnpm husky init
```

**`.husky/pre-commit`**：

```sh
npx lint-staged
```

**`.husky/commit-msg`**：

```sh
npx --no -- commitlint --edit $1
```

**`lint-staged.config.mjs`**：

```js
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml}': ['prettier --write'],
}
```

**`commitlint.config.mjs`**：

```js
export default { extends: ['@commitlint/config-conventional'] }
```

在根 `package.json` 加入 `prepare` 脚本，确保 clone 后自动初始化 husky：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

### Conventional Commits 类型

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

> **为什么用 lint-staged 而不是全量 lint？**
> lint-staged 只检查暂存文件，避免大型 monorepo 中全量 lint 耗时过长破坏开发体验。

---

## 1.5 构建基础设施

### 技术选型

| 工具   | 用途                  | 理由                                              |
| ------ | --------------------- | ------------------------------------------------- |
| Rollup | 库打包                | 产物干净，Tree-shaking 优秀，适合库（非应用）打包 |
| Vite   | playground 开发服务器 | 基于 Rollup，HMR 极快                             |
| `tsx`  | 运行构建脚本          | 无需编译直接运行 TypeScript 脚本                  |

```bash
pnpm add -D rollup @rollup/plugin-typescript @rollup/plugin-node-resolve @rollup/plugin-commonjs rollup-plugin-dts tslib tsx -w
```

### Rollup 基础配置工厂（`rollup.config.base.mjs`）

封装为 `createConfig()` 工厂函数，供所有子包复用，默认输出 ESM / CJS / IIFE / `.d.ts`：

```js
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

export function createConfig({
  input = 'src/index.ts',
  name,
  external = [],
  iife = true,
  dtsEnabled = true,
  globals = {},
  plugins: extraPlugins = [],
}) {
  const basePlugins = [
    resolve({ extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
  ]
  const plugins = [...basePlugins, ...extraPlugins]

  const configs = [
    {
      input,
      external,
      output: { file: 'dist/index.mjs', format: 'esm', sourcemap: true },
      plugins,
    },
    {
      input,
      external,
      output: { file: 'dist/index.cjs', format: 'cjs', sourcemap: true, exports: 'named' },
      plugins,
    },
  ]

  if (iife) {
    configs.push({
      input,
      external,
      output: { file: 'dist/index.iife.js', format: 'iife', name, globals, sourcemap: true },
      plugins,
    })
  }

  if (dtsEnabled) {
    configs.push({
      input,
      output: { file: 'dist/index.d.ts', format: 'esm' },
      plugins: [dts()],
    })
  }

  return configs
}
```

### 构建产物结构

```
dist/
├── index.mjs        # ESM（现代打包工具 / Node ESM）
├── index.cjs        # CJS（Node CommonJS / 旧版构建工具）
├── index.iife.js    # IIFE（<script> 标签直接引入）
├── index.d.ts       # TypeScript 类型声明入口
└── index.d.ts.map   # 类型声明 Source Map
```

### 批量构建脚本（`scripts/build.ts`）

遍历 `packages/` 下所有子包，依次执行 `rollup -c`：

```ts
import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../..')
const packagesDir = join(root, 'packages')

const packages = readdirSync(packagesDir).filter((name) =>
  existsSync(join(packagesDir, name, 'package.json')),
)

for (const pkg of packages) {
  console.log(`\nBuilding ${pkg}...`)
  execSync('pnpm rollup -c', { cwd: join(packagesDir, pkg), stdio: 'inherit' })
}
```

在根 `package.json` 加入脚本：

```json
{
  "scripts": {
    "build": "tsx scripts/build.ts"
  }
}
```

---

## 1.6 版本与发布（Changesets）

### 为什么选 Changesets？

| 方案                          | 说明                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **`@changesets/cli`**（选用） | 每次 PR 附带 `.changeset/*.md` 描述变更，合并后统一执行 `changeset version` 更新版本号和 CHANGELOG，与 pnpm workspaces 原生集成 |
| `lerna version`（未选用）     | 历史包袱较重，配置繁琐                                                                                                          |
| 手动维护 CHANGELOG（未选用）  | 易出错，无法与 git 历史关联                                                                                                     |

```bash
pnpm add -D @changesets/cli -w
pnpm changeset init
```

**`.changeset/config.json`**：

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

在根 `package.json` 加入发布脚本：

```json
{
  "scripts": {
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build && changeset publish"
  }
}
```

**发布流程：**

```
开发 → pnpm changeset（生成 changeset 文件）
     → PR 合并到 main
     → pnpm version-packages（更新版本号 + CHANGELOG）
     → pnpm release（构建 + 发布到 npm）
```

---

## 1.7 CI/CD（GitHub Actions）

### 整体设计

两条流水线，职责分明：

| 文件          | 触发条件          | 职责                                            |
| ------------- | ----------------- | ----------------------------------------------- |
| `ci.yml`      | PR / push 到 main | 代码质量校验（lint → typecheck → test → build） |
| `release.yml` | push 到 main      | 版本 PR / 自动发布到 npm                        |

### `ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  ci:
    name: Lint, typecheck, test coverage, build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9.0.0

      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:coverage
      - run: pnpm build
```

> `--frozen-lockfile`：必须严格按 `pnpm-lock.yaml` 安装，防止"本地偷偷改了依赖但没提交 lockfile"。

### `release.yml`

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      packages: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 拉取完整历史，Changesets 需要

      - uses: pnpm/action-setup@v4
        with:
          version: 9.0.0

      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm
          registry-url: https://registry.npmjs.org

      - run: pnpm install --frozen-lockfile

      - uses: changesets/action@v1
        with:
          version: pnpm version-packages
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**`changesets/action` 的两种状态：**

- 存在未消费的 changeset → 自动创建/更新**版本 PR**（执行 `pnpm version-packages`）
- 版本 PR 已合并 → 自动**发布到 npm**（执行 `pnpm release`）

> **注意**：要让自动发布生效，必须在 GitHub 仓库 Settings → Secrets 中配置 `NPM_TOKEN`。

---

## 完成后的根目录结构

完成阶段一后，根目录结构如下：

```
monorepo-package-boilerplate/
├── .changeset/
│   └── config.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── .husky/
│   ├── commit-msg
│   └── pre-commit
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── packages/
│   └── .gitkeep
├── scripts/
│   ├── build.ts
│   └── .gitkeep
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .node-version
├── .npmrc
├── .nvmrc
├── .prettierignore
├── commitlint.config.mjs
├── eslint.config.mjs
├── lint-staged.config.mjs
├── package.json
├── pnpm-workspace.yaml
├── prettier.config.mjs
├── rollup.config.base.mjs
├── tsconfig.base.json
└── tsconfig.json
```
