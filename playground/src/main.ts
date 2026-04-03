// 在这里引入 packages/* 中的包进行本地联调
// 示例（添加子包后取消注释）：
// import { myFunction } from 'my-lib'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h1>Playground</h1>
  <p>在 <code>src/main.ts</code> 中引入本地包进行调试。</p>
`
