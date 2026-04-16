# 快速开始

## 环境要求

- Node.js `>=20`
- pnpm `>=9`

## 安装依赖

```bash
pnpm install
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm test
pnpm docs:dev
pnpm docs:build
```

## 新建一个库包

1. 在 `packages/` 下新增子目录，例如 `packages/my-lib`
2. 创建入口文件 `src/index.ts`
3. 继承根 TypeScript 配置
4. 配置 `package.json` 的 `exports`、`main`、`module`、`types`
5. 添加测试并通过 `playground` 验证

## 文档维护建议

- 首页用于说明模板目标与能力边界
- `guide/` 放接入与开发指南
- `api/` 放对外导出的 API 总览和子模块说明
- 每新增一个公开包，都应补充对应文档
