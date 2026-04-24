# 阶段五：工程维护与自动化

为了保证脚手架及其模板能够长期保持最新，同时不因依赖升级引入破坏性变更，本项目引入了基于 **Renovate** 的自动化更新机制和基于 **CI** 的模板校验体系。

## 1. 自动化依赖更新 (Renovate)

我们使用 [Renovate](https://www.mend.io/repository-management/renovate/) 来监控依赖版本。其配置文件位于 [`.github/renovate.json`](file:///.github/renovate.json)。

### 1.1 分类处理策略

为了兼顾效率与安全，我们将依赖分为两类进行差异化处理：

- **开发依赖 (devDependencies)**:
  - 如 `typescript`, `vitest`, `eslint`, `prettier` 等。
  - **策略**: 只要 CI 通过，即开启 **自动合并 (Automerge)**。
  - **理由**: 这些工具通常具有良好的向后兼容性，且即使出问题也只影响开发阶段，不影响产物运行。

- **核心/同级依赖 (peerDependencies)**:
  - 如 `cesium`, `vue`, `react` 等。
  - **策略**: 禁用自动合并。Renovate 会在 **Dependency Dashboard** 中列出可用更新，需手动确认后才会创建 PR。
  - **理由**: 这些依赖与模板代码高度耦合。大版本升级（如 Vue 3.4 -> 3.5 或 Cesium 升级）可能需要同步修改模板代码或 Rollup 配置。

### 1.2 模板监控

虽然 `scripts/templates/` 下的 `package.json` 不在 pnpm workspace 中，但 Renovate 已被配置为扫描这些文件。这确保了通过 `pnpm create:package` 创建出的新项目默认就是最新的。

---

## 2. CI 模板校验 (Quality Guard)

自动合并依赖的前提是 **CI 必须能发现潜在的破坏性变更**。我们在 [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) 中增加了一层“模板验证”逻辑：

### 2.1 验证逻辑

每当有 PR 提交（包括 Renovate 自动创建的 PR）时，CI 会执行以下步骤：

1.  **实例化模板**: 调用 `pnpm create:package` 为每一个场景（utils, component, react, vue, cesium）创建一个真实的临时包。
2.  **重构依赖图谱**: 运行 `pnpm install`。由于新包在 `packages/` 下，它们会被加入当前 workspace。
3.  **全量构建**: 运行 `pnpm build`。此时 `scripts/build.ts` 会识别到新创建的包并尝试调用 Rollup 进行打包。

### 2.2 意义

如果某个依赖升级（例如 `rollup` 的插件 API 变了，或 `cesium` 修改了导出路径）导致现有模板代码失效，这一步构建就会报错。这拦截了 99% 潜在的升级风险。

---

## 3. 维护建议

1.  **定期检查 Dashboard**: 定期访问 GitHub Repo 的 Issues 页面，查看 Renovate 生成的 Dependency Dashboard。
2.  **手动合并 Major 更新**: 对于 Major 版本的升级，合并前务必在本地运行 `pnpm create:package` 手动验证生成的代码是否符合预期。
3.  **更新测试用例**: 如果依赖升级导致 Vitest 报错，请及时同步更新根目录或各包下的测试用例。
