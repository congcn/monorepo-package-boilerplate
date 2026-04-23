import { defineConfig } from 'vitepress'

const docsBase = process.env.DOCS_BASE ?? '/'
const base = docsBase.endsWith('/') ? docsBase : `${docsBase}/`

export default defineConfig({
  base,
  title: 'Monorepo Package Boilerplate',
  description: '一个可复用的 monorepo 组件库脚手架模板',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '快速开始', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '工程溯源', link: '/internals/' },
      { text: 'GitHub', link: 'https://github.com/CongYao1993/monorepo-package-boilerplate' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '多场景包开发', link: '/guide/scenarios' }
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 文档',
          items: [{ text: '总览', link: '/api/' }],
        },
      ],
      '/internals/': [
        {
          text: '工程溯源',
          items: [
            { text: '概述', link: '/internals/' },
            { text: '阶段一：Monorepo 基础设施', link: '/internals/phase-1-monorepo' },
            { text: '阶段二：示例包结构', link: '/internals/phase-2-package' },
            { text: '阶段三：文档站', link: '/internals/phase-3-docs' },
            { text: '阶段四：多场景脚手架', link: '/internals/phase-4-scenarios' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/CongYao1993/monorepo-package-boilerplate' },
    ],
    footer: {
      message: 'Built with pnpm workspaces, TypeScript, Rollup and VitePress.',
      copyright: 'Copyright © 2026 Monorepo Package Boilerplate',
    },
    search: {
      provider: 'local',
    },
  },
})

