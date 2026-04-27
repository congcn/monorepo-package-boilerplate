import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function init() {
  console.log('\n🚀 欢迎使用 Monorepo 模板初始化脚本！')
  console.log('我们将引导你完成项目品牌化与文档清理。\n')

  const projectName = await rl.question('请输入项目名称（例如: my-awesome-lib）: ')
  const npmScope = await rl.question('请输入 NPM Scope（可选，例如: @my-org，直接回车跳过）: ')
  const description = await rl.question('请输入项目描述: ')
  const githubUrl = await rl.question(
    '请输入 GitHub 仓库地址（例如: https://github.com/user/repo）: ',
  )

  rl.close()

  console.log('\n⏳ 正在处理...')

  const cleanGithubUrl = githubUrl.replace(/\.git$/, '')

  const pkgPath = path.resolve(ROOT_DIR, 'package.json')
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))

  pkg.name = npmScope ? `${npmScope}/${projectName}` : projectName
  pkg.description = description
  pkg.repository = { type: 'git', url: `git+${cleanGithubUrl}.git` }
  pkg.homepage = `${cleanGithubUrl}#readme`
  pkg.bugs = { url: `${cleanGithubUrl}/issues` }

  delete pkg.scripts.init

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  console.log('✅ 已更新 package.json')

  const configPath = path.resolve(ROOT_DIR, 'docs/.vitepress/config.mts')
  let configContent = await fs.readFile(configPath, 'utf-8')

  configContent = configContent
    .replace(/title: '.*'/, `title: '${projectName}'`)
    .replace(/description:\s*'[^']*'/, `description: '${description.replace(/'/g, "\\'")}'`)
    .replace(/\{ text: '工程溯源', link: '\/internals\/' \},\s*/, '')
    .replace(/'\/internals\/': \[[\s\S]*?\],\s*/, '')
    .replace(/\{ icon: 'github', link: '[^']+' \}/, `{ icon: 'github', link: '${cleanGithubUrl}' }`)
    .replace(/Monorepo Package Boilerplate/g, projectName)

  await fs.writeFile(configPath, configContent, 'utf-8')
  console.log('✅ 已更新 docs/.vitepress/config.mts')

  const internalsDir = path.resolve(ROOT_DIR, 'docs/internals')
  const guideDir = path.resolve(ROOT_DIR, 'docs/guide')
  const archiveDir = path.resolve(ROOT_DIR, '.boilerplate-docs')

  try {
    await fs.rm(internalsDir, { recursive: true, force: true })
    console.log('✅ 已删除 docs/internals 目录')

    await fs.mkdir(archiveDir, { recursive: true })
    await fs.rename(guideDir, path.resolve(archiveDir, 'guide'))
    await fs.mkdir(guideDir, { recursive: true })
    await fs.writeFile(
      path.resolve(guideDir, 'getting-started.md'),
      `# 快速开始

本项目是一个基于 pnpm workspaces 的 Monorepo 模板，用于构建组件库或 npm 包。

## 安装依赖

\`\`\`bash
pnpm install
\`\`\`

## 常用命令

- \`pnpm dev:playground\`：启动联调环境
- \`pnpm build\`：构建所有包
- \`pnpm docs:dev\`：启动文档站
- \`pnpm test\`：运行测试

## 创建新包

\`\`\`bash
pnpm create:package --name <name> --template <type>
\`\`\`
`,
      'utf-8',
    )
    console.log('✅ 已归档旧 guide，并生成新的快速开始文档')
  } catch {
    // Ignore when guide/internals are missing.
  }

  const docsIndexPath = path.resolve(ROOT_DIR, 'docs/index.md')
  const docsIndexContent = `# ${projectName}

${description}

## 快速入口

- [API 文档](/api/)

## 推荐工作流

1. 在 \`packages/\` 下创建新包
2. 在 \`playground/\` 中联调
3. 在 \`docs/\` 中补充业务文档和 API 文档
`
  await fs.writeFile(docsIndexPath, docsIndexContent, 'utf-8')
  console.log('✅ 已重置 docs/index.md')

  const apiIndexPath = path.resolve(ROOT_DIR, 'docs/api/index.md')
  const apiIndexContent = `# API 文档

这里是项目 API 文档总览。请根据你的业务需求添加子包文档链接。

## 快速入口

（等待添加第一个包...）
`
  await fs.writeFile(apiIndexPath, apiIndexContent, 'utf-8')
  console.log('✅ 已重置 docs/api/index.md')

  try {
    const readmePath = path.resolve(ROOT_DIR, 'README.md')
    const readmeContent = `# ${projectName}

${description}

## 开发与构建

1. 安装依赖：\`pnpm install\`
2. 构建项目：\`pnpm build\`
3. 启动开发：\`pnpm dev:playground\`
4. 启动文档：\`pnpm docs:dev\`

更多细节请查看 \`docs/\` 目录。`
    await fs.writeFile(readmePath, readmeContent, 'utf-8')

    const basePkgPath = path.resolve(ROOT_DIR, 'scripts/templates/base/package.json')
    let basePkgContent = await fs.readFile(basePkgPath, 'utf-8')
    basePkgContent = basePkgContent.replace(
      /CongYao1993\/monorepo-package-boilerplate/g,
      cleanGithubUrl.replace('https://github.com/', ''),
    )
    await fs.writeFile(basePkgPath, basePkgContent, 'utf-8')

    const docsYmlPath = path.resolve(ROOT_DIR, '.github/workflows/docs.yml')
    let docsYmlContent = await fs.readFile(docsYmlPath, 'utf-8')
    const repoName = cleanGithubUrl.split('/').pop() || projectName
    docsYmlContent = docsYmlContent.replace(
      /DOCS_BASE: \/monorepo-package-boilerplate\//g,
      `DOCS_BASE: /${repoName}/`,
    )
    await fs.writeFile(docsYmlPath, docsYmlContent, 'utf-8')

    console.log('✅ 已更新 README 与模板元信息')
  } catch (err) {
    console.error('⚠️ 更新附加模板信息时出错：', err)
  }

  const scriptPath = fileURLToPath(import.meta.url)
  await fs.rm(scriptPath)
  console.log('✅ 初始化脚本已自毁')

  console.log('\n✅ 初始化完成！')
  console.log('--------------------------------------------------')
  console.log('后续建议操作：')
  console.log('1. 清理旧 Git 历史：rm -rf .git（Windows: Remove-Item -Recurse -Force .git）')
  console.log(
    '2. 重新初始化 Git：git init && git add -A && git commit -m "feat: init from template"',
  )
  console.log('3. 关联远程仓库：git remote add origin <your-repo-url> && git branch -M main')
  console.log('4. 配置 GitHub Pages：仓库 Settings -> Pages -> Source 选择 GitHub Actions')
  console.log('5. 推送远程仓库：git push -u origin main')
  console.log('--------------------------------------------------\n')
}

init().catch((err) => {
  console.error('\n❌ 初始化失败:', err)
  process.exit(1)
})
