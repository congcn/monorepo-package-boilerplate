# API 文档规划

当前文档站先提供 API 结构规划，后续每个包按统一格式扩展。

## 建议结构

### 包级入口

- 包简介
- 安装方式
- 使用示例
- 导出成员列表

### 模块级页面

如果某个包提供子路径导出，例如 `my-lib/foo`，建议为每个模块建立单独页面，保持与 `exports` 结构一致。

## `my-lib`

### `helloMyLib(name)`

- **参数**：`name: string`
- **返回值**：`string`
- **说明**：返回一段简单问候语，用于验证模板中的构建、测试与文档链路。

```ts
import { helloMyLib } from 'my-lib'

console.log(helloMyLib('VitePress'))
```
