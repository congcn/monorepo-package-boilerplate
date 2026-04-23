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
  console.log('我们将引导你完成项目的品牌定制与大扫除。\n')

  // 1. 收集信息
  const projectName = await rl.question('请输入你的项目名称 (例如: my-awesome-lib): ')
  const npmScope = await rl.question(
    '请输入你的 NPM Scope (可选，例如: @my-org，直接回车则不使用): ',
  )
  const description = await rl.question('请输入项目描述: ')
  const githubUrl = await rl.question(
    '请输入 GitHub 仓库地址 (例如: https://github.com/user/repo): ',
  )

  rl.close()

  console.log('\n⏳ 正在处理中...')

  // 处理 GitHub 地址，避免重复的 .git
  const cleanGithubUrl = githubUrl.replace(/\.git$/, '')

  // 2. 修改 package.json
  const pkgPath = path.resolve(ROOT_DIR, 'package.json')
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))

  pkg.name = npmScope ? `${npmScope}/${projectName}` : projectName
  pkg.description = description
  pkg.repository = { type: 'git', url: `git+${cleanGithubUrl}.git` }
  pkg.homepage = `${cleanGithubUrl}#readme`
  pkg.bugs = { url: `${cleanGithubUrl}/issues` }

  // 移除 init 脚本
  delete pkg.scripts.init

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  console.log('✅ 已更新 package.json')

  // 3. 修改 docs/.vitepress/config.mts
  const configPath = path.resolve(ROOT_DIR, 'docs/.vitepress/config.mts')
  let configContent = await fs.readFile(configPath, 'utf-8')

  // 替换基本信息
  configContent = configContent
    .replace(/title: '.*'/, `title: '${projectName}'`)
    .replace(/description:\s*'[^']*'/, `description:\n    '${description}'`)
    .replace(
      /socialLinks: \[\s*\{\s*icon: 'github',\s*link: '[^']+'\s*\},?\s*\]/,
      `socialLinks: [\n      { icon: 'github', link: '${cleanGithubUrl}' }\n    ]`,
    )
    .replace(
      /copyright: 'Copyright © \d{4} .*'/,
      `copyright: 'Copyright © ${new Date().getFullYear()} ${projectName}'`,
    )
    .replace(/https:\/\/github\.com\/CongYao1993\/monorepo-package-boilerplate/g, cleanGithubUrl)

  // 移除 internals 导航 (匹配整个 nav 项 and sidebar 项)
  configContent = configContent
    .replace(/\{\s*text: '工程溯源',\s*link: '\/internals\/'\s*\},\s*/g, '')
    // 精准匹配 sidebar 中的 /internals/ 块，直到遇到缩进为6个空格的 ], 为止
    .replace(/\s*'\/internals\/': \[[\s\S]*?\n\s{6}\],?/g, '')

  // 移除 guide 导航 (因为我们要清理掉默认的新手教程)
  configContent = configContent
    .replace(/\{\s*text: '快速开始',\s*link: '\/guide\/getting-started'\s*\},\s*/g, '')
    .replace(/\s*'\/guide\/': \[[\s\S]*?\n\s{6}\],?/g, '')

  await fs.writeFile(configPath, configContent, 'utf-8')
  console.log('✅ 已更新 docs/.vitepress/config.mts')

  // 4. 清理与归档冗余文件
  const internalsDir = path.resolve(ROOT_DIR, 'docs/internals')
  const guideDir = path.resolve(ROOT_DIR, 'docs/guide')
  const archiveDir = path.resolve(ROOT_DIR, '.boilerplate-docs')

  try {
    // 彻底删除工程溯源文档
    await fs.rm(internalsDir, { recursive: true, force: true })
    console.log('✅ 已删除 docs/internals 目录')

    // 归档开发指南备查
    await fs.mkdir(archiveDir, { recursive: true })
    await fs.rename(guideDir, path.resolve(archiveDir, 'guide'))
    console.log('✅ 已将 docs/guide 归档备查')
  } catch {
    // 忽略错误，如果文件不存在则不处理
  }

  const docsIndexPath = path.resolve(ROOT_DIR, 'docs/index.md')
  const docsIndexContent = `# ${projectName}

${description}

## 快速入口

- [API 文档](/api/)

## 推荐工作流

1. 在 \`packages/\` 下创建新包
2. 在 \`playground/\` 中联调
3. 在 \`docs/\` 中补充业务组件的文档与 API
`
  await fs.writeFile(docsIndexPath, docsIndexContent, 'utf-8')
  console.log('✅ 已重置 docs/index.md')

  const apiIndexPath = path.resolve(ROOT_DIR, 'docs/api/index.md')
  const apiIndexContent = `# API 文档

这里是项目的 API 文档总览。请根据你的业务需求在此添加子包的文档链接。

## 快速入口

(等待添加第一个包...)
`
  await fs.writeFile(apiIndexPath, apiIndexContent, 'utf-8')
  console.log('✅ 已重置 docs/api/index.md')

  // 5. 替换其他文件中的模板名称
  console.log('⏳ 正在替换其余模板信息...')
  try {
    const readmePath = path.resolve(ROOT_DIR, 'README.md')
    const readmeContent = `# ${projectName}

${description}

## 开发与构建

1. 安装依赖: \`pnpm install\`
2. 构建项目: \`pnpm build\`
3. 启动开发: \`pnpm dev:playground\`
4. 启动文档: \`pnpm docs:dev\`

有关此工作区的详细说明，请参阅本地 \`docs/\` 目录下的文档。
`
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

    const gettingStartedPath = path.resolve(ROOT_DIR, '.boilerplate-docs/guide/getting-started.md')
    if (await fs.stat(gettingStartedPath).catch(() => null)) {
      let gettingStartedContent = await fs.readFile(gettingStartedPath, 'utf-8')
      gettingStartedContent = gettingStartedContent.replace(
        /monorepo-package-boilerplate/g,
        projectName,
      )
      gettingStartedContent = gettingStartedContent.replace(
        /CongYao1993\/monorepo-package-boilerplate/g,
        cleanGithubUrl.replace('https://github.com/', ''),
      )
      await fs.writeFile(gettingStartedPath, gettingStartedContent, 'utf-8')
    }

    console.log('✅ 已更新 README.md 与模板文件')
  } catch (err) {
    console.error('⚠️ 替换其他模板信息时出错:', err)
  }

  // 6. 自毁
  const scriptPath = fileURLToPath(import.meta.url)
  await fs.rm(scriptPath)
  console.log('✅ 初始化脚本已自毁')

  console.log('\n✨ 初始化完成！')
  console.log('--------------------------------------------------')
  console.log('后续建议操作：')
  console.log(
    '1. 运行 \x1b[33mrm -rf .git\x1b[0m 清理原模板历史 (Windows: Remove-Item -Recurse -Force .git)',
  )
  console.log('2. 运行 \x1b[33mgit init\x1b[0m 开启你的全新 Git 历程')
  console.log('3. 运行 \x1b[33mpnpm install\x1b[0m 重新安装依赖')
  console.log('--------------------------------------------------\n')
}

init().catch((err) => {
  console.error('\n❌ 初始化失败:', err)
  process.exit(1)
})
