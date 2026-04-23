# 阶段四：多场景脚手架系统

> **目标**：从单一示例包演进为支持多种常见包结构的模板系统，通过 `pnpm create:package` 一键生成符合特定场景的包骨架。

---

## 设计思路

在没有脚手架系统之前，每次新建一个包都要手动复制文件、改包名、调整依赖——机械、容易出错。

脚手架系统的目标是：**一条命令，生成符合该场景约定的完整包骨架**，包括 `package.json`、`tsconfig.json`、`rollup.config.mjs`、`vitest.config.ts`、示例源文件和测试文件。

---

## 4.1 场景分类

当前支持 5 种场景模板：

| 模板        | 适用范围                                             |
| ----------- | ---------------------------------------------------- |
| `utils`     | 无 UI 的纯逻辑包（数学库、请求封装、数据转换工具等） |
| `component` | 框架无关的原生 DOM/Web Components 组件               |
| `react`     | React 框架组件库                                     |
| `vue`       | Vue 框架组件库（含 SFC 编译支持）                    |
| `cesium`    | Cesium 3D 地球二次封装库                             |

### 各场景核心约定

#### Utils 场景

- **运行环境**：Node.js 或浏览器均可
- **构建输出**：ESM / CJS / `.d.ts`，IIFE 可选
- **测试环境**：默认 Node 环境
- **依赖策略**：极少依赖，必要时放 `dependencies`

#### 框架无关 Component 场景

- **运行环境**：浏览器
- **测试环境**：`jsdom`（需在子包 `vitest.config.ts` 中指定）
- **依赖策略**：不预置任何 UI 框架运行库

#### React 场景

- **构建输出**：使用 `@rollup/plugin-typescript` 编译 TSX，不输出 IIFE
- **依赖策略（绝对隔离）**：
  - 根目录**不引入** React 相关依赖
  - `react`、`react-dom` 作为子包 `peerDependencies`
  - `@testing-library/react` 等仅存在于子包 `devDependencies`

#### Vue 场景

- **构建输出**：使用 `rollup-plugin-vue` 编译 SFC，不输出 IIFE
- **依赖策略（绝对隔离）**：
  - 根目录**不引入** Vue 相关依赖
  - `vue` 作为子包 `peerDependencies`

#### Cesium 场景

- **运行环境**：浏览器，强依赖 Cesium 运行时
- **依赖策略**：`cesium` 必须作为 `peerDependencies`
- **外部化（Critical）**：在 `rollup.config.mjs` 中**必须**将 `cesium` 列入 `external`，同时配置 `globals: { cesium: 'Cesium' }` 供 IIFE 使用
- **资源处理**：Cesium 通常带有额外 Assets/Workers，宿主环境需自行处理资源拷贝

---

## 4.2 文件模板系统

### 目录结构

```
scripts/
├── create-package.ts      # 脚手架命令行入口
└── templates/
    ├── base/              # 基础模板（所有场景共享）
    ├── utils/             # utils 场景覆盖文件
    ├── component/         # component 场景覆盖文件
    ├── react/             # react 场景覆盖文件
    ├── vue/               # vue 场景覆盖文件
    └── cesium/            # cesium 场景覆盖文件
```

### 模板合并策略

生成包时分两步：

1. **复制 `base/` 模板** — 提供所有场景共有的文件（`package.json` 基础字段、`tsconfig.json`、`vitest.config.ts`、示例 `src/index.ts`）
2. **复制场景模板** — 覆盖/补充场景特有文件，`package.json` 采用**深度合并**，scripts/dependencies 等字段会 merge 而不是覆盖

### 占位符替换

模板文件中使用占位符，生成时自动替换：

```
__PACKAGE_NAME__  →  包名（如 my-cesium-utils）
__PACKAGE_DESC__  →  包描述
```

---

## 4.3 `create-package.ts` 实现

**命令行用法：**

```bash
# 指定包名、模板和描述
pnpm create:package --name my-cesium-utils --template cesium --desc "My Cesium utility library"

# 简写
pnpm create:package -n my-cesium-utils -t cesium
```

**核心逻辑：**

```ts
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const PACKAGES_DIR = path.resolve(ROOT_DIR, 'packages')
const TEMPLATES_DIR = path.resolve(__dirname, 'templates')

async function createPackage() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string', short: 'n' },
      template: { type: 'string', short: 't' },
      desc: { type: 'string', short: 'd' },
    },
  })

  const packageName = values.name
  const templateName = values.template || 'utils'
  const packageDesc = values.desc || `A ${templateName} package.`

  if (!packageName) {
    console.error('Error: Package name is required. Use --name or -n.')
    process.exit(1)
  }

  const targetDir = path.resolve(PACKAGES_DIR, packageName)
  const baseTemplateDir = path.resolve(TEMPLATES_DIR, 'base')
  const scenarioTemplateDir = path.resolve(TEMPLATES_DIR, templateName)

  // 1. 创建包目录
  await fs.mkdir(targetDir, { recursive: true })

  // 2. 复制基础模板
  await copyDirAndReplace(baseTemplateDir, targetDir, {
    __PACKAGE_NAME__: packageName,
    __PACKAGE_DESC__: packageDesc,
  })

  // 3. 复制场景模板（覆盖基础模板，package.json 合并）
  await copyDirAndReplace(scenarioTemplateDir, targetDir, {
    __PACKAGE_NAME__: packageName,
    __PACKAGE_DESC__: packageDesc,
  })
}
```

在根 `package.json` 加入命令：

```json
{
  "scripts": {
    "create:package": "tsx scripts/create-package.ts"
  }
}
```

---

## 4.4 测试隔离架构

### 为什么需要 Workspace 模式？

不同场景的测试需求差异很大：

- `utils` 包 → Node 环境即可
- `component`/`react`/`vue`/`cesium` 包 → 需要 `jsdom` 模拟 DOM

**Workspace 模式**让每个子包可以有独立的 `vitest.config.ts`，覆盖根配置的 `environment`：

```ts
// packages/example-cesium/vitest.config.ts
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    environment: 'jsdom', // 只影响本包，不污染其他包
  },
})
```

根配置通过 `projects: ['packages/*']` 自动发现所有子包，无需手动注册。

---

## 4.5 生成一个 Cesium 包的完整流程

```bash
# 1. 生成包骨架
pnpm create:package --name my-cesium-viewer --template cesium --desc "Cesium viewer wrapper"

# 2. 安装依赖（让 pnpm 识别新包）
pnpm install

# 3. 进入包目录，开始开发
cd packages/my-cesium-viewer

# 4. 构建验证
pnpm build

# 5. 回到根目录运行测试
cd ../..
pnpm test
```

---

## 4.6 场景选择决策树

```
你的包需要操作 DOM 吗？
  ├─ 否 → utils 模板
  └─ 是 → 是否依赖特定框架？
          ├─ 否 → component 模板
          └─ 是 → 使用哪个框架？
                  ├─ React → react 模板
                  ├─ Vue   → vue 模板
                  └─ Cesium → cesium 模板
```
