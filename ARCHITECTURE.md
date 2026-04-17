# 架构设计总览

本文档记录各阶段每一步的架构设计思路与技术选型依据。

“工程底座” -> “包设计” -> “文档与交付”。

## 1. monorepo 基础设施

聚焦 workspace、TypeScript、代码规范、提交规范、构建基础设施、版本与发布等工程底座。

- [`ARCHITECTURE_monorepo.md`](./ARCHITECTURE_monorepo.md)

## 2. 示例包架构

聚焦 `packages/my-lib` 的包结构、导出设计、构建产物、测试与 playground 联调链路。

- [`ARCHITECTURE_lib.md`](./ARCHITECTURE_lib.md)

## 3. 文档站架构

聚焦 `docs/` 文档站的信息架构、VitePress 配置与部署方案。

- [`ARCHITECTURE_docs.md`](./ARCHITECTURE_docs.md)
