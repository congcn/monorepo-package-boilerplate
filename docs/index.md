# Package Template

一套标准化、可复用的 monorepo 组件库脚手架，目标是让新的组件库项目可以直接基于该模板启动，而不是从零重复搭建工程基础设施。

## 你能得到什么

- `pnpm workspaces` 管理多包工程
- `TypeScript` 严格类型约束
- `Rollup` 输出 ESM / CJS / IIFE / `.d.ts`
- `Vitest` 单元测试链路
- `Changesets` 版本与发布流程
- `VitePress` 文档站能力

## 快速入口

- [快速开始](/guide/getting-started)
- [API 文档结构](/api/)

## 推荐工作流

1. 在 `packages/` 下创建新包
2. 继承根 `tsconfig.base.json`
3. 配置子包 `package.json` 与 `rollup.config.mjs`
4. 在 `playground/` 中联调
5. 在 `docs/` 中补充使用文档与 API
6. 通过 `changeset` 管理版本发布
