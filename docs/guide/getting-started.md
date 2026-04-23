# 快速开始：从零搭建你的组件库

本文档将手把手带你完成从 Fork 本模板，到走通本地联调，再到完成自动化发布的完整闭环。

## 环境要求

- Node.js `>=20`
- pnpm `>=9`

---

## Step 1: 获取代码与一键品牌定制

基于本模板开启新项目时，首先我们需要获取代码并完成品牌信息的替换和冗余文件的清理。

1. **克隆代码**：
   ```bash
   git clone https://github.com/CongYao1993/monorepo-package-boilerplate.git
   cd monorepo-package-boilerplate
   ```
2. **安装依赖**：运行初始化脚本前需要先安装依赖以加载运行环境（如 `tsx`）。
   ```bash
   pnpm install
   ```
3. **运行初始化脚本**：

   ```bash
   pnpm run init
   ```

   根据终端提示输入你的项目名称、NPM Scope、描述等信息。脚本会自动帮你修改 `package.json`、定制文档站配置，并自动归档/删除冗余文档。脚本执行完成后会自动从系统中“自毁”。

   > [!TIP]
   > 强烈建议在初始化时填入你的 NPM 组织作用域（Scope，例如 `@your-org`）。这样后续在此 Monorepo 中生成的所有子包（如 `@your-org/button`、`@your-org/utils`）都能统一在此命名空间下，既整齐又能避免发布时与 NPM 上的其他包重名。

## Step 2: 重新初始化 Git (强烈建议)

执行完一键初始化脚本后，你的项目代码已经焕然一新（去除了原模板信息）。此时我们再彻底清理历史，让新项目有一个干净的起点。

1. **删除旧 Git 记录**：`rm -rf .git` (Windows 下可使用 `Remove-Item -Recurse -Force .git`)
2. **重新初始化**：
   ```bash
   git init
   git add -A
   git commit -m "feat: init from monorepo-package-boilerplate"
   ```
3. **关联你的新远程仓库**：
   ```bash
   git remote add origin https://github.com/<你的用户名>/<你的新仓库>.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: 准备联调底座 (Playground 适配)

开发组件时，我们需要一个实时的网页预览环境，这就是 `playground` 目录的作用。

> [!IMPORTANT]
> 本模板默认提供的 `playground` 是一个最纯粹的 **原生 TypeScript** 环境。
> 如果你打算开发的是 **Vue** 或 **React** 组件库，你需要先为 Playground 配置对应的运行环境！

**如果你开发 Vue 组件库：**

```bash
# 1. 给 playground 安装 vue 和 vite 插件
pnpm -F playground add vue
pnpm -F playground add -D @vitejs/plugin-vue

# 2. 修改 playground/vite.config.ts，引入并使用 vue 插件
```

**如果你开发 React 组件库：**

```bash
# 1. 给 playground 安装 react 体系
pnpm -F playground add react react-dom
pnpm -F playground add -D @vitejs/plugin-react @types/react @types/react-dom

# 2. 修改 playground/vite.config.ts，引入并使用 react 插件
```

配置完成后，将 `playground/src/main.ts` 改造成对应框架的挂载入口即可。

## Step 4: 产出第一个业务包

一切就绪，开始写代码。本模板内置了自动化脚手架，避免手动复制粘贴配置：

```bash
# 交互式提示创建（或者直接带参数执行）
pnpm create:package
```

根据提示输入包名（如 `button`），选择你需要的模板类型（支持 `utils`、`component`、`react`、`vue`、`cesium` 等）。
脚手架会自动在 `packages/` 目录下生成完整的工程结构、独立构建配置和测试基座。

## Step 5: 本地联调与测试闭环

生成新包后，将其接入联调环境并开启开发模式：

### 1. 挂载依赖

因为是在 Monorepo 中，你需要告诉 Playground 依赖这个本地包：
打开 `playground/package.json`，在 `dependencies` 中添加：`"你的新包名": "workspace:*"`，然后执行一次 `pnpm install`。

### 2. 双终端热更新开发

在 Playground 的业务代码中 `import` 你的新组件。为了实现改动组件源码网页立刻刷新，建议双开终端：

- **终端 A**：执行 `pnpm dev` 启动调试网页。
- **终端 B**：执行 `pnpm -F <包名> build --watch` 监听组件源码构建。每次保存代码，构建产物更新，网页自动热重载。

### 3. 单元测试

直接在根目录执行以下命令，Vitest 会自动穿透到各子包执行它们独立的测试配置：

```bash
pnpm test
# 或带覆盖率执行
pnpm test:coverage
```

## Step 6: 打通自动化发布链路

代码开发并测试完毕后，我们将利用 Changesets 和 GitHub Actions 实现完全自动化的发版流程。

> [!WARNING]
> 发版前的必备动作：你必须前往你的 GitHub 仓库 Settings -> Secrets and variables -> Actions，添加名为 `NPM_TOKEN` 的 Secret（在 npmjs.com 生成的发布令牌）。如果没有此令牌，自动化发布将会失败！

**日常发布工作流：**

1. **记录变更**：在本地完成开发后，运行 `pnpm changeset`，选择修改过的包并填写更新日志。这会生成一个变更文件，将其一并提交到 Git。
2. **触发合并**：将代码提交并创建 PR 合并到 `main` 分支。
3. **版本管理 PR**：此时，GitHub Actions（`Release` 流水线）会自动拦截，并为你创建一个特殊的“Version Packages PR”。这个 PR 汇总了所有的变更日志，并修改了包的版本号。
4. **一键发布**：当团队 Review 并 Merge 这个特殊的 Version PR 后，Action 会再次触发，自动执行构建、打 Git Tag、并把所有更新的包**发布到 NPM**。

至此，你已经完整跑通了一个现代组件库的全部工程链路！
