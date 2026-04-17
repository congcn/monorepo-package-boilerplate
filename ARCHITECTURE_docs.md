# 架构设计文档

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
