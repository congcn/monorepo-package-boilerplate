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

| 方案                          | 说明                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| pnpm workspaces（选用）       | 原生 monorepo 支持，符号链接替代真实安装，磁盘占用小；严格隔离依赖，不允许访问未声明的包（禁止幽灵依赖） |
| npm/yarn workspaces（未选用） | 默认提升所有依赖到根目录，幽灵依赖问题难以发现                                                           |

**根 package.json 设计要点**

- `"private": true`：防止根包被意外发布到 npm
- `"engines"` 字段：锁定 `node>=20` 和 `pnpm>=9`，保证团队环境一致
- `"packageManager"` 字段：配合 corepack，自动使用指定版本的 pnpm，无需全局安装

**`.npmrc` 关键配置**

| 配置项                      | 值      | 作用                                    |
| --------------------------- | ------- | --------------------------------------- |
| `shamefully-hoist`          | `false` | 保持严格隔离，禁止幽灵依赖              |
| `auto-install-peers`        | `true`  | 自动安装 peerDependencies，减少手动操作 |
| `link-workspace-packages`   | `true`  | workspace 内包优先使用本地链接版本      |
| `prefer-workspace-packages` | `true`  | 确保本地包始终优先于 registry           |

---

### 1.2 TypeScript 配置

**分层继承策略**

根目录 `tsconfig.base.json` 定义全局严格规则，各子包通过 `"extends": "../../tsconfig.base.json"` 继承，按需覆盖 `paths`、`outDir` 等字段。

| 配置               | 值             | 理由                                                   |
| ------------------ | -------------- | ------------------------------------------------------ |
| `strict`           | `true`         | 开启全部严格检查（strictNullChecks、noImplicitAny 等） |
| `moduleResolution` | `Bundler`      | 对齐 Vite/Rollup 的模块解析行为，支持 `exports` 字段   |
| `target`           | `ES2020`       | 覆盖现代浏览器，避免过多 polyfill                      |
| `declaration`      | `true`         | 构建时同步输出 `.d.ts`                                 |
| `declarationMap`   | `true`         | 生成 `.d.ts.map`，IDE 跳转定义能直达源码               |
| `composite`        | `true`（子包） | 配合 `tsc --build` 实现增量编译                        |

---

### 1.3 代码规范

**工具分工**

| 工具                     | 职责                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------- |
| ESLint                   | 代码质量检查（逻辑错误、最佳实践），使用 `@typescript-eslint` flat config（ESLint v9+） |
| Prettier                 | 格式化（空格、换行、引号），不与 ESLint 规则重叠                                        |
| `eslint-config-prettier` | 关闭 ESLint 中与 Prettier 冲突的格式化规则，放在 extends 最后                           |
| `.editorconfig`          | IDE 级别的基础格式约束，跨编辑器保持一致                                                |

**原则**：ESLint 负责"写法对不对"，Prettier 负责"格式好不好"，两者职责不重叠。

**VS Code 工作区配置**

| 文件                      | 作用                                                                                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.vscode/settings.json`   | `editor.formatOnSave` + `source.fixAll.eslint`，保存时自动格式化并修复可自动修复的 ESLint 问题；`eslint.useFlatConfig: true` 启用 flat config 模式；`typescript.tsdk` 指向本地 TypeScript，避免使用 VS Code 内置版本 |
| `.vscode/extensions.json` | 推荐安装 Prettier、ESLint、EditorConfig 插件，新成员 clone 仓库后 VS Code 自动提示安装                                                                                                                               |

**设计决策**：将 VS Code 配置纳入版本控制，确保团队所有成员在 VS Code 中开箱即得一致的格式化行为，无需手动配置。`eslint.useFlatConfig` 需显式声明，因为 ESLint VS Code 插件默认仍按旧 `.eslintrc` 模式查找配置文件。

---

### 1.4 Git 提交规范

**工具链**

| 工具        | 触发时机       | 作用                                               |
| ----------- | -------------- | -------------------------------------------------- |
| Husky       | 安装 git hooks | 管理 `.husky/` 下的 hook 脚本                      |
| lint-staged | `pre-commit`   | 只对暂存区文件执行 lint/format，速度远快于全量扫描 |
| Commitlint  | `commit-msg`   | 校验提交信息符合 Conventional Commits 规范         |

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

| 工具              | 用途                  | 理由                                              |
| ----------------- | --------------------- | ------------------------------------------------- |
| Rollup            | 库打包                | 产物干净，Tree-shaking 优秀，适合库（非应用）打包 |
| Vite              | playground 开发服务器 | 基于 Rollup，HMR 极快                             |
| `vite-plugin-dts` | 生成 `.d.ts`          | 从源码直接生成类型声明，无需单独跑 `tsc`          |
| `tsx`             | 运行构建脚本          | 无需编译直接运行 TypeScript 脚本                  |

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

文件 说明
rollup.config.base.mjs Rollup 配置工厂函数，createConfig() 输出 ESM/CJS/IIFE + .d.ts
scripts/build.ts 遍历 packages/\*，对每个子包执行 rollup -c
playground/package.json playground 包配置，dev 脚本启动 Vite
playground/vite.config.ts Vite 配置，端口 3000
playground/index.html HTML 入口
playground/src/main.ts 调试入口，引入本地包
playground/tsconfig.json 继承根配置
后续使用方式：每个子包新建 rollup.config.mjs，从根配置导入 createConfig：

import { createConfig } from '../../rollup.config.base.mjs'
export default createConfig({ name: 'MyLib' })
然后 pnpm build 即可构建所有包，pnpm dev 启动 playground。

---

### 1.6 版本与发布

**技术选型：Changesets**

| 方案                         | 说明                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `@changesets/cli`（选用）    | 每次 PR 附带 `.changeset/*.md` 描述变更，合并后统一执行 `changeset version` 更新版本号和 CHANGELOG，与 pnpm workspaces 原生集成 |
| `lerna version`（未选用）    | 历史包袱较重，配置繁琐                                                                                                          |
| 手动维护 CHANGELOG（未选用） | 易出错，无法与 git 历史关联                                                                                                     |

**Changesets 配置说明（`.changeset/config.json`）**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- `$schema`：JSON Schema 提示与校验，提升编辑体验。
- `changelog`：使用官方 changelog 生成器，在 `changeset version` 时自动更新 `CHANGELOG.md`。
- `commit: false`：版本变更后不自动提交，保留手动审查与提交流程。
- `fixed` / `linked`：包版本联动策略，当前为空表示各包独立版本管理。
- `access: public`：默认按公开包发布到 npm。
- `baseBranch: main`：以 `main` 作为变更比较与发布基线分支。
- `updateInternalDependencies: patch`：内部依赖变更时，依赖方至少进行 patch 级别更新。
- `ignore`：排除不参与版本/发布的包，当前为空表示全部纳入。

**脚本约定（根 `package.json`）**

- `pnpm changeset`：创建 `.changeset/*.md`，记录变更影响包与版本级别。
- `pnpm version-packages`：执行 `changeset version`，统一更新版本号与 `CHANGELOG.md`。
- `pnpm release`：先 `pnpm build`，再 `changeset publish` 发布到 npm。

**发布流程**

```
开发 → pnpm changeset（生成 changeset 文件）→ PR 合并到 main
→ pnpm version-packages（更新版本号 + CHANGELOG）
→ pnpm release（构建并发布）
```

---

### 1.7 CI/CD（可选）

当前仓库已经落地了两个 GitHub Actions 工作流：

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

它们分别负责：

- `ci.yml`：做“代码质量校验”
- `release.yml`：做“版本 PR / 自动发布”

可以把它们理解成：

- **CI** = 代码变更时，自动检查项目有没有坏
- **CD** = 合并到主分支后，自动推进版本和发布流程

---

#### 1）`ci.yml` 是怎么工作的

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main
```

这部分表示：

- 工作流名字叫 `CI`
- 触发时机有两个：
  - 任意 `pull_request`
  - `push` 到 `main`

也就是：

- 提 PR 时会自动检查一次
- 直接往 `main` 推代码时也会检查一次

这样可以保证主分支和 PR 都经过统一验证。

```yaml
jobs:
  ci:
    name: Lint, typecheck, test, build
    runs-on: ubuntu-latest
```

这部分表示定义了一个 `ci` 任务：

- 任务展示名是 `Lint, typecheck, test, build`
- 运行环境是 GitHub 提供的 Linux 虚拟机 `ubuntu-latest`

GitHub Actions 的本质，就是在触发事件后临时开一台干净机器，按顺序执行你定义的步骤。

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4
```

第一步是把仓库代码拉到这台临时机器上。不 checkout 的话，后面的命令没有代码可执行。

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9.0.0
```

安装并启用 `pnpm`，版本固定为 `9.0.0`，和根 `package.json` 的 `packageManager` 保持一致。

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: .node-version
    cache: pnpm
```

这一步做两件事：

- 根据根目录 `.node-version` 安装 Node.js
- 开启 `pnpm` 缓存，减少重复安装依赖的时间

`node-version-file` 的好处是：本地开发和 CI 统一使用同一个 Node 版本来源，避免版本漂移。

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

安装依赖。

这里用了 `--frozen-lockfile`，意思是：

- 必须严格按照 `pnpm-lock.yaml` 安装
- 如果 `package.json` 和 lockfile 不一致，直接报错

这样可以防止“本地偷偷改了依赖但没提交 lockfile”这种问题。

```yaml
- name: Lint
  run: pnpm lint

- name: Typecheck
  run: pnpm typecheck

- name: Test
  run: pnpm test

- name: Build
  run: pnpm build
```

这四步就是 CI 的核心校验：

- `pnpm lint`：检查代码规范和潜在问题
- `pnpm typecheck`：运行 TypeScript 类型检查
- `pnpm test`：执行单元测试
- `pnpm build`：验证项目是否能成功构建

设计意图是：**只要其中任一步失败，这次 CI 就失败**，PR 就会显示红灯，提醒开发者修复问题。

---

#### 2）`release.yml` 是怎么工作的

```yaml
name: Release

on:
  push:
    branches:
      - main
```

这部分表示：

- 工作流名字叫 `Release`
- 只有当代码 push 到 `main` 时才会触发

也就是说，发布流程不会在普通分支或 PR 上运行，只会在主分支运行。

```yaml
jobs:
  release:
    name: Version or publish packages
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      packages: write
```

这里定义了一个 `release` 任务。

`permissions` 的含义：

- `contents: write`：允许修改仓库内容，比如推送版本变更
- `pull-requests: write`：允许创建或更新版本 PR
- `packages: write`：允许包发布相关操作

因为 `changesets/action` 需要自动创建 PR 或发布包，所以必须给对应权限。

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4
    with:
      fetch-depth: 0
```

这里同样先拉代码，但多了 `fetch-depth: 0`。

它的作用是拉取完整 git 历史，而不是默认的浅克隆。Changesets 在判断版本、生成 PR、处理发布时，完整历史会更稳妥。

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9.0.0

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: .node-version
    cache: pnpm
    registry-url: https://registry.npmjs.org
```

和 CI 类似，这里也会安装 pnpm 和 Node。额外的：

- `registry-url: https://registry.npmjs.org`

表示后续发布默认面向 npm 官方仓库。

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

同样严格按照 lockfile 安装依赖，确保发布环境可重复。

```yaml
- name: Create release pull request or publish
  uses: changesets/action@v1
  with:
    version: pnpm version-packages
    publish: pnpm release
```

这是整个发布流程的核心。

`changesets/action` 会根据仓库里有没有未消费的 `.changeset/*.md` 文件，做两类事情：

##### 情况 A：存在 changeset，但还没生成版本 PR

它会执行：

- `pnpm version-packages`

也就是运行：

- `changeset version`

作用是：

- 更新相关包的 `version`
- 更新 `CHANGELOG.md`
- 生成一个“版本更新 PR”

这个 PR 通常会把所有待发布的版本修改集中起来，方便审查。

##### 情况 B：版本 PR 已合并，已经具备发布条件

它会执行：

- `pnpm release`

根据你当前根 `package.json`，这个脚本等价于：

- `pnpm build && changeset publish`

也就是：

1. 先构建项目
2. 再把需要发布的包发布到 npm

所以这个工作流并不是“每次 push main 就直接盲目发包”，而是借助 Changesets 按状态决定：

- 是先创建/更新版本 PR
- 还是正式发布

这也是 Changesets 推荐的标准模式。

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

这里配置的是发布所需的环境变量：

- `GITHUB_TOKEN`：GitHub 自动提供，用于创建 PR、推送提交等仓库操作
- `NPM_TOKEN`：需要你手动在 GitHub 仓库 Secrets 中配置，用于向 npm 发布包

如果没有 `NPM_TOKEN`，版本 PR 仍可能创建成功，但真正发布到 npm 会失败。

---

#### 3）这两个工作流之间的关系

可以把它们理解成两层防线：

##### 第一层：`ci.yml`

负责回答：

- 这次代码改动有没有把项目搞坏？
- lint、类型、测试、构建能不能通过？

##### 第二层：`release.yml`

负责回答：

- 主分支上是否有需要发布的 changeset？
- 现在应该创建版本 PR，还是直接发布 npm 包？

也就是说：

- `ci.yml` 偏向“质量校验”
- `release.yml` 偏向“版本与交付”

---

#### 4）为什么当前这样设计

结合当前仓库现状，这套配置有几个特点：

1. **和现有脚本完全对齐**
   - `lint` → `pnpm lint`
   - `typecheck` → `pnpm typecheck`
   - `test` → `pnpm test`
   - `build` → `pnpm build`
   - `version` → `pnpm version-packages`
   - `publish` → `pnpm release`

2. **和 Changesets 配套**
   当前仓库已经有 `.changeset/config.json`，因此发布流程直接采用 `changesets/action` 最自然。

3. **兼容模板仓库场景**
   即使现在 `packages/` 下还没有真正的示例包，CI/CD 架子也已经搭好；后面你补充 `my-lib`、测试和文档后，这套流程可以直接继续复用。

---

#### 5）使用时的注意事项

- 如果当前项目还没有配置好 Vitest，`pnpm test` 可能失败，这是正常的阶段性现象。
- 如果还没有可发布的包，`changeset publish` 不会真正发布内容。
- 要让自动发布生效，必须在 GitHub 仓库设置 `NPM_TOKEN`。
- 推荐结合 GitHub 分支保护规则，要求 PR 必须通过 `CI` 后才能合并到 `main`。

---

#### 6）一句话理解

- `ci.yml`：**每次改代码，都在一台干净机器上重新跑一遍 lint / 类型检查 / 测试 / 构建**
- `release.yml`：**每次主分支更新，都让 Changesets 判断现在是该出版本 PR，还是该正式发 npm 包**

这就是当前仓库 `1.7 CI/CD` 的实现原理。

---

---

## 阶段 2 — 示例包（packages/my-lib）

阶段 2 的目标不是只“放一个示例包”，而是把 **一个可发布的包、一个本地联调入口、一个最小测试闭环** 串起来。当前仓库已经按这个方向落地：`packages/my-lib` 负责产出构建结果，`playground` 负责消费包并验证改动，根目录统一管理测试与构建。

### 2.1 包初始化

当前 `my-lib` 采用标准 npm 包出口设计，消费方始终通过 `dist` 使用构建产物，而不是直接引用源码：

```json
{
  "name": "my-lib",
  "version": "0.0.0",
  "private": false,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

#### package.json 字段说明

- `name`
  - 包名。
  - 这里是 `my-lib`，因此在 `playground` 或未来外部项目里，都会通过 `import { ... } from 'my-lib'` 的方式使用它。

- `version`
  - 包版本号。
  - 当前示例阶段使用 `0.0.0`，后续正式进入发布流程后会由 Changesets 统一管理版本变更。

- `private`
  - 是否为私有包。
  - 这里显式写成 `false`，表示它是一个“可发布”的示例包，而不是仅供仓库内部使用的私有目录。

- `type`
  - 指定当前包的模块系统语义。
  - 这里使用 `module`，表示包内 `.js` 文件按 ESM 处理，和当前 Rollup / Vite 的 ESM 配置保持一致。

- `main`
  - CommonJS 默认入口。
  - 指向 `./dist/index.cjs`，主要照顾仍然使用 `require()` 的 Node 或旧工具链消费方。

- `module`
  - ESM 入口。
  - 指向 `./dist/index.mjs`，主要给现代打包工具识别使用。
  - 严格说现代解析更依赖 `exports`，但保留 `module` 能增强兼容性。

- `types`
  - TypeScript 类型声明入口。
  - 指向 `./dist/index.d.ts`，让 TS 用户在导入 `my-lib` 时能拿到完整类型提示。

- `exports`
  - 包的显式导出映射表，也是现代 Node / bundler 最重要的解析入口。
  - 当前只暴露了根出口 `.`，表示外部只能消费包根路径。
  - 其中各字段含义如下：
    - `types`：类型声明入口
    - `import`：ESM 环境入口
    - `require`：CommonJS 环境入口
    - `default`：默认回退到 ESM 入口
  - 这样可以让不同消费环境命中最合适的构建产物。

- `files`
  - 控制发包时实际包含哪些文件。
  - 这里写成 `["dist"]`，表示 npm 发布时只带构建产物，不把 `src`、测试文件和本地配置一起发出去。

- `scripts`
  - 当前子包的本地命令集合。
  - 这里的每个脚本分别负责：
    - `build`：执行一次正式构建，输出 `dist`
    - `dev`：以 watch 模式持续构建，供 playground 联调
    - `test`：运行该包相关测试
    - `typecheck`：只做类型检查，不输出文件

这样设计有三个目的：

1. **与真实发布行为一致**：`playground` 联调时消费的是和未来 npm 用户一致的包入口。
2. **同时兼容 ESM / CJS / 类型声明**：浏览器构建工具、Node 环境和 TS 编辑器都能命中对应出口。
3. **控制发布内容**：通过 `files: ["dist"]` 限制发包内容，避免源码和临时文件进入 npm 包。

#### tsconfig.json 设计

当前 `my-lib` 的 `tsconfig.json` 如下：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

#### tsconfig.json 字段说明

- `$schema`
  - 给编辑器提供 JSON Schema 提示。
  - 不影响构建结果，但能让 IDE 在编辑 `tsconfig.json` 时提供补全和校验。

- `extends`
  - 继承根目录公共 TypeScript 配置。
  - 这样所有子包都能共享同一套基础规则，例如模块解析、严格模式、目标版本等，避免每个包重复维护。

- `compilerOptions`
  - 当前子包对 TS 编译行为的局部覆盖配置。
  - 在这个包里主要补充了构建目录和测试类型环境。

- `compilerOptions.rootDir`
  - 指定源码根目录。
  - 这里是 `src`，表示编译器默认把 `src/` 视为输入源目录，有助于保持输出目录结构稳定。

- `compilerOptions.outDir`
  - 指定编译输出目录。
  - 这里是 `dist`，和 `package.json` 中声明的导出目录保持一致。

- `compilerOptions.types`
  - 显式注入需要的全局类型包。
  - 这里是 `vitest/globals`，这样测试文件里才能直接使用 `describe`、`it`、`expect` 等全局 API 而不报类型错误。

- `include`
  - 指定当前 tsconfig 要纳入处理的文件范围。
  - 这里写成 `["src"]`，表示只关注当前包源码和测试文件所在目录，避免把无关文件带进来。

这种 `tsconfig` 设计体现的是“根配置统一、子包最小覆写”的原则：

- 公共规则放到根目录
- 子包只声明自己额外需要的最少字段
- 新增子包时几乎可以直接复制这份配置

这种拆分方式的重点是：**子包只声明自己是什么，构建策略由根目录统一维护**。这样后续新增 `packages/button`、`packages/utils` 等包时，可以复用同一套模板。

### 2.2 源码与构建结构

当前示例包的最小结构如下：

```text
packages/my-lib/
├── src/
│   ├── index.ts
│   └── index.test.ts
├── package.json
├── rollup.config.mjs
└── tsconfig.json
```

各文件职责明确：

- `src/index.ts`：公开 API 入口，放对外导出的函数或组件。
- `src/index.test.ts`：与入口能力配套的最小单元测试。
- `tsconfig.json`：继承根目录 `tsconfig.base.json`，仅补充子包自身的 `rootDir`、`outDir` 等配置。
- `rollup.config.mjs`：复用根目录 `rollup.config.base.mjs`，避免每个包重复写一份完整构建逻辑。

#### 构建产物策略

示例包当前通过 Rollup 输出四类文件：

- `dist/index.mjs`：给 ESM 消费方使用
- `dist/index.cjs`：给 CommonJS 消费方使用
- `dist/index.iife.js`：给浏览器 `<script>` 场景使用
- `dist/index.d.ts`：给 TypeScript 类型系统使用

这些产物共同组成了一个“可发布包”的最小交付面：既能被现代 bundler 消费，也能兼容 CommonJS，同时保留完整类型信息。

### 2.3 单元测试

当前仓库的 Vitest 采用根目录统一配置，测试文件匹配规则为 `packages/*/src/**/*.test.ts`。这意味着：

- 每个子包都可以把测试和源码放在一起维护
- 根目录运行 `pnpm test` 时可以一次性执行所有子包测试
- 子包内部也保留独立 `test` 脚本，便于按包调试

这种模式适合模板仓库早期阶段：

- 配置简单
- 心智负担低
- 扩展到多包时不需要重新设计测试入口

### 2.4 playground 联调机制

`playground` 通过 `workspace:*` 依赖本地包：

```json
{
  "dependencies": {
    "my-lib": "workspace:*"
  }
}
```

这里有一个非常关键的实现细节：**联调不是靠 Vite alias 直连源码，而是靠 pnpm workspace 链接 + 包的 `dist` 出口完成的**。

也就是说，正确链路是：

1. 在仓库根目录执行 `pnpm install`，由 pnpm 建立 workspace 链接
2. `playground` 通过包名 `my-lib` 解析到本地 workspace 包
3. `my-lib` 的 `exports` 再把入口指向 `dist/index.mjs`
4. 开发时由 `rollup -w` 持续刷新 `dist`
5. `playground` 作为真实 consumer 感知更新

这样设计比直接 alias 到 `src/index.ts` 更合理，因为它验证的是完整的“包消费链路”，而不是仅验证源码能否被 Vite 编译。

### 2.5 本地开发流程

#### 首次初始化或依赖变更后

```bash
pnpm install
```

#### 第一次启动某个包时

```bash
pnpm build:my-lib
```

#### 日常联调时

终端 1：

```bash
pnpm dev:my-lib
```

终端 2：

```bash
pnpm dev:playground
```

其中：

- `dev:my-lib` 会执行 `rollup -c -w`，持续输出最新 `dist`
- `dev:playground` 会启动 Vite playground，用真实包名导入组件/工具函数

因此开发者修改 `packages/my-lib/src/*` 后，不需要重新安装依赖，只需要保持 watch 进程运行即可。

### 2.6 阶段 2 的价值

这一阶段完成后，仓库已经具备了一个组件库模板最重要的基础能力：

- **能写包**：有清晰的子包结构
- **能测包**：有统一测试入口
- **能构建包**：有稳定的多格式产物输出
- **能联调包**：有基于 workspace 的本地消费链路

这意味着后续新增任何真实业务组件包时，不需要重新讨论工程底座，只需要复制 `my-lib` 的模式并填入具体实现即可。

---

## 阶段 3 — 文档站

当前仓库已为文档站补齐最小可用闭环，目标是让模板不仅能“构建和发布包”，还能“承载接入说明与 API 文档”。

**技术选型：VitePress**

| 方案                 | 说明                                                                       |
| -------------------- | -------------------------------------------------------------------------- |
| VitePress（选用）    | 基于 Vite，支持 Vue 组件嵌入，构建产物为静态 HTML，适合部署到 GitHub Pages |
| Storybook（未选用）  | 更适合 UI 组件交互展示，配置复杂度高，偏重 React/Vue 生态                  |
| Docusaurus（未选用） | React 生态，与本项目 TS-first 风格契合度低于 VitePress                     |

已落地内容包括：

- `docs/package.json`：将 `docs` 作为 workspace 子包管理，提供 `dev` / `build` / `preview` 脚本
- `docs/.vitepress/config.mts`：VitePress 站点配置，包含导航、侧边栏、本地搜索与页脚
- `docs/index.md`：首页，说明模板定位、能力边界与推荐工作流
- `docs/guide/getting-started.md`：快速开始文档，约定环境要求、常用命令与新建子包步骤
- `docs/api/index.md`：API 文档结构规划页，先定义统一文档组织方式，再逐步扩展具体包
- `.github/workflows/docs.yml`：文档构建与 GitHub Pages 部署工作流

### 3.1 为什么文档站单独作为 workspace 包

将 `docs/` 纳入 `pnpm-workspace.yaml` 管理，而不是作为零散静态目录，主要有三个原因：

1. **依赖隔离**：VitePress 依赖只安装在 `docs` importer 下，不污染其他包语义
2. **脚本清晰**：通过根脚本 `pnpm docs:dev` / `pnpm docs:build` 统一调度，同时保留文档站自身脚本职责
3. **便于部署**：CI/CD 中可直接对 `docs` 执行构建，输出目录固定为 `docs/.vitepress/dist`

### 3.2 文档结构约定

建议采用两层结构：

```text
docs/
├── index.md                 # 首页
├── guide/
│   └── getting-started.md   # 接入 / 开发指南
└── api/
    └── index.md             # API 结构总览
```

这样划分的原因是：

- `index.md` 负责说明“项目是什么、适合什么、不适合什么”
- `guide/` 负责说明“如何安装、如何开发、如何扩展”
- `api/` 负责说明“公开导出什么、如何使用、后续如何扩展”

后续新增包时，可按包名继续扩展，如：

- `docs/api/my-lib.md`
- `docs/api/my-lib/foo.md`

并尽量与包的 `exports` 子路径保持一致，降低文档与代码结构偏移。

### 3.3 VitePress 配置设计

当前 `docs/.vitepress/config.mts` 主要启用了以下能力：

- `nav`：顶部导航，提供“快速开始”和“API”入口
- `sidebar`：按 `guide/` 与 `api/` 分区组织侧边栏
- `search.provider: 'local'`：使用本地搜索，零额外服务依赖
- `cleanUrls: true`：生成更整洁的文档 URL
- `lastUpdated: true`：为后续接入 git 最后更新时间展示预留能力

设计原则是：**优先提供模板级文档骨架，而不是一次性写满业务内容**。脚手架仓库的重点是沉淀结构和约定，具体组件/包文档由后续使用者在此基础上填充。

### 3.4 部署方案：GitHub Pages

文档部署选择 GitHub Pages，原因是：

- 与当前 GitHub Actions 工作流天然集成
- 适合作为模板仓库的默认演示站点
- 无需额外维护服务器或独立部署平台

`docs.yml` 的职责链路如下：

1. push 到 `main` 或手动触发工作流
2. 安装 Node / pnpm 并恢复缓存
3. 执行 `pnpm install --frozen-lockfile`
4. 执行 `pnpm docs:build`
5. 上传 `docs/.vitepress/dist` 制品
6. 部署到 GitHub Pages

如果后续切换到 Vercel，通常只需要替换部署平台配置，而不需要重写文档目录结构。

---

## 关键设计原则

1. **与业务完全解耦**：脚手架不含任何业务逻辑，`packages/` 下仅放示例包
2. **按子路径拆分**：`exports` 字段 + 独立 chunk，支持原生按需引入
3. **完整 TypeScript 类型**：所有公开 API 有类型声明，`declaration` + `declarationMap` 同步输出
4. **复用优先**：新组件库直接 fork/clone 此模板，无需额外配置
