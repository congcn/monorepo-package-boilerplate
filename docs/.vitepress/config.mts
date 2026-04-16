import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Package Template',
  description: '一个可复用的 monorepo 组件库脚手架模板',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '快速开始', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/your-org/package-template' },
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
    socialLinks: [{ icon: 'github', link: 'https://github.com/your-org/package-template' }],
    footer: {
      message: 'Built with pnpm workspaces, TypeScript, Rollup and VitePress.',
      copyright: 'Copyright © 2026 Package Template',
    },
    search: {
      provider: 'local',
    },
  },
})
