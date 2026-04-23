# 阶段三：文档站

> **目标**：为 Monorepo 配套一个轻量文档站，能随代码一起维护，自动部署到 GitHub Pages。

---

## 技术选型

| 方案                  | 说明                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| **VitePress**（选用） | 基于 Vite，支持 Vue 组件嵌入，构建产物为静态 HTML，适合部署到 GitHub Pages |
| Storybook（未选用）   | 更适合 UI 组件交互展示，配置复杂度高                                       |
| Docusaurus（未选用）  | React 生态，与本项目 TS-first 风格契合度低                                 |

---

## 3.1 初始化文档站

### 为什么 `docs/` 作为独立 workspace 包？

1. **依赖隔离**：VitePress 依赖只装在 `docs` 下，不污染其他包
2. **脚本清晰**：根目录通过 `pnpm docs:dev` / `pnpm docs:build` 统一调度
3. **便于部署**：CI 直接对 `docs` 执行构建，输出目录固定为 `docs/.vitepress/dist`

```bash
mkdir docs
cd docs
pnpm init
pnpm add -D vitepress
npx vitepress init
```

**`docs/package.json`**：

```json
{
  "name": "docs",
  "private": true,
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.x.x"
  }
}
```

在根 `package.json` 加入文档脚本：

```json
{
  "scripts": {
    "docs:dev": "pnpm --filter docs dev",
    "docs:build": "pnpm --filter docs build"
  }
}
```

---

## 3.2 文档目录结构约定

```
docs/
├── .vitepress/
│   └── config.mts         # VitePress 站点配置
├── guide/
│   └── getting-started.md # 快速开始
├── api/
│   └── index.md           # API 文档总览
└── index.md               # 首页
```

**分层职责：**

- `index.md` — 说明"项目是什么、适合什么、不适合什么"
- `guide/` — 说明"如何安装、如何开发、如何扩展"
- `api/` — 说明"公开导出什么、如何使用"

后续新增包时，按包名扩展 `api/`，尽量与包的 `exports` 子路径保持一致：

```
docs/api/
├── index.md
├── my-lib.md
└── my-lib/
    └── foo.md
```

---

## 3.3 VitePress 配置

**`docs/.vitepress/config.mts`**：

```ts
import { defineConfig } from 'vitepress'

const docsBase = process.env.DOCS_BASE ?? '/'
const base = docsBase.endsWith('/') ? docsBase : `${docsBase}/`

export default defineConfig({
  base,
  title: 'My Package',
  description: '一个可复用的 monorepo 组件库脚手架模板',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '快速开始', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/your-org/your-repo' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [{ text: '快速开始', link: '/guide/getting-started' }],
        },
      ],
      '/api/': [
        {
          text: 'API 文档',
          items: [{ text: '总览', link: '/api/' }],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/your-org/your-repo' }],
    footer: {
      message: 'Built with VitePress.',
    },
    search: {
      provider: 'local',
    },
  },
})
```

**关键配置说明：**

| 配置                       | 说明                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `base`                     | 支持通过环境变量 `DOCS_BASE` 设置部署路径前缀，适配 GitHub Pages 子路径部署 |
| `cleanUrls: true`          | 生成更整洁的文档 URL（去掉 `.html` 后缀）                                   |
| `lastUpdated: true`        | 为后续接入 git 最后更新时间展示预留能力                                     |
| `search.provider: 'local'` | 本地搜索，零额外服务依赖                                                    |

---

## 3.4 部署方案：GitHub Pages

**`.github/workflows/docs.yml`**：

```yaml
name: Deploy Docs

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
        with:
          version: 9.0.0

      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Build docs
        run: pnpm docs:build
        env:
          DOCS_BASE: /your-repo-name/ # 替换为你的 GitHub 仓库名

      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

> **注意**：部署前需要在 GitHub 仓库 Settings → Pages → Source 中选择 **GitHub Actions**。

---

## 3.5 `.gitignore` 补充

确保文档构建产物不进入版本库：

```
.vitepress/dist/
docs/.vitepress/cache/
```
