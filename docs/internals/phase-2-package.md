# 阶段二：示例包结构

> **目标**：在 Monorepo 底座上创建第一个可发布的包，打通"写包 → 测包 → 构建包 → 联调包"的完整链路。

---

## 2.1 包初始化

在 `packages/` 下创建子包目录：

```bash
mkdir packages/my-lib
```

### 子包 `package.json` 设计

```json
{
  "$schema": "https://json.schemastore.org/package",
  "name": "my-lib",
  "version": "0.0.0",
  "description": "A template library package.",
  "keywords": [],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-org/monorepo-package-boilerplate.git",
    "directory": "packages/my-lib"
  },
  "homepage": "https://github.com/your-org/monorepo-package-boilerplate#readme",
  "bugs": {
    "url": "https://github.com/your-org/monorepo-package-boilerplate/issues"
  },
  "private": false,
  "type": "module",
  "sideEffects": false,
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
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

**关键字段说明：**

| 字段                   | 说明                                                               |
| ---------------------- | ------------------------------------------------------------------ |
| `"private": false`     | 标记为可发布到 npm，区别于根包的 `private: true`                   |
| `"type": "module"`     | 包内 `.js` 文件按 ESM 处理                                         |
| `"sideEffects": false` | 纯函数式输出，告知打包工具可以激进 Tree-shaking                    |
| `exports`              | 现代 Node/bundler 最重要的解析入口，分 types/import/require 三条件 |
| `"files"`              | 控制 npm 发布内容，只打包 `dist`、`README.md`、`LICENSE`           |
| `"module"`             | 给旧版打包工具识别 ESM 入口（补充 `exports` 的兼容性）             |
| `repository.directory` | 指向 monorepo 中的具体子包目录，npm 页面可以精准跳转               |

### 子包 `tsconfig.json`

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

- `extends`：继承根目录公共规则，子包只声明差异
- `types: ["vitest/globals"]`：注入 Vitest 全局 API 类型，测试文件里可以直接用 `describe`/`it`/`expect`

---

## 2.2 源码与构建

### 目录结构

```
packages/my-lib/
├── src/
│   ├── index.ts       # 公开 API 入口
│   └── index.test.ts  # 配套单元测试
├── package.json
├── rollup.config.mjs  # 复用根配置
└── tsconfig.json
```

### `rollup.config.mjs`（子包）

从根目录导入工厂函数，按需配置：

```js
import { createConfig } from '../../rollup.config.base.mjs'

export default createConfig({
  name: 'MyLib', // IIFE 全局变量名
  iife: true, // 是否输出 IIFE
  external: [], // 不打包进产物的外部依赖
  globals: {}, // IIFE 模式下外部依赖的全局变量映射
})
```

**不同场景的配置示例：**

```js
// 工具库：不需要 IIFE（没有浏览器 <script> 场景）
createConfig({ iife: false })

// Cesium 封装库：把 cesium 排除在外，映射为全局变量 Cesium
createConfig({
  name: 'MyCesiumLib',
  iife: true,
  external: ['cesium'],
  globals: { cesium: 'Cesium' },
})
```

> ⚠️ **陷阱**：IIFE 格式必须同时声明 `external` 和 `globals`，否则外部依赖会被整个打包进产物（如把整个 Cesium 打入 IIFE，会产生 10MB+ 的文件）。

---

## 2.3 单元测试

### 根目录 Vitest 配置（`vitest.config.ts`）

采用 **Workspace 模式**，根配置统一管理所有子包测试：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['packages/*'], // 自动发现子包
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**/*.{ts,tsx,vue}'],
      exclude: ['packages/*/src/**/*.test.{ts,tsx}', 'packages/*/src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
})
```

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom -w
```

### 子包 Vitest 配置（`packages/my-lib/vitest.config.ts`）

每个子包可以有自己的配置覆盖根配置（如切换 test environment）：

```ts
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    // 默认 Node 环境，UI 包可以改为 'jsdom'
    // environment: 'jsdom',
  },
})
```

### 示例测试文件（`src/index.test.ts`）

```ts
import { describe, it, expect } from 'vitest'
import { add } from './index'

describe('my-lib', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})
```

在根 `package.json` 加入测试脚本：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 2.4 Playground 联调机制

Playground 是一个 Vite 驱动的本地调试应用，通过 `workspace:*` 直接链接本地包：

```bash
mkdir playground
cd playground
pnpm init
pnpm add -D vite
```

**`playground/package.json`**：

```json
{
  "name": "playground",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "my-lib": "workspace:*"
  }
}
```

**联调链路**（关键设计）：

> Playground 不是靠 Vite alias 直连源码，而是靠 **pnpm workspace 链接 + 包的 `dist` 出口**完成的。

```
pnpm install（建立 workspace 链接）
  → playground 通过包名 my-lib 解析到本地 workspace 包
  → my-lib 的 exports 把入口指向 dist/index.mjs
  → rollup -w 持续刷新 dist
  → playground 感知更新
```

这样验证的是完整的"包消费链路"，而不是仅验证源码能否被 Vite 编译，和真实用户的使用方式完全一致。

### 日常联调流程

```bash
# 首次初始化
pnpm install

# 终端 1：监听子包构建
pnpm -F my-lib dev

# 终端 2：启动 playground
pnpm dev:playground
```

修改 `packages/my-lib/src/*` 后，保持 watch 进程运行，playground 自动热更新。

---

## 2.5 阶段二完成后的能力清单

| 能力        | 实现方式                                          |
| ----------- | ------------------------------------------------- |
| ✅ 能写包   | 清晰的子包结构，`src/index.ts` 作为 API 入口      |
| ✅ 能测包   | Vitest Workspace 模式，根目录一键运行所有子包测试 |
| ✅ 能构建包 | Rollup 输出 ESM / CJS / IIFE / `.d.ts`            |
| ✅ 能联调包 | playground 通过 workspace 链接消费本地 `dist`     |
