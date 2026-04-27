import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const root = resolve(__dirname, '..')
const packagesDir = join(root, 'packages')
const docsApiDir = join(root, 'docs/api')

/**
 * 自动生成 API 文档脚本
 * 使用 TypeDoc + typedoc-plugin-markdown
 */
async function genApiDocs() {
  const packages = readdirSync(packagesDir).filter((name) => {
    const pkgPath = join(packagesDir, name)
    return existsSync(join(pkgPath, 'package.json')) && existsSync(join(pkgPath, 'src'))
  })

  if (packages.length === 0) {
    console.log('未发现需要生成文档的包。')
    return
  }

  console.log(`\n🔍 发现 ${packages.length} 个包，准备生成 API 文档...\n`)

  for (const pkg of packages) {
    console.log(`--------------------------------------------------`)
    console.log(`📦 正在为 [${pkg}] 生成文档...`)

    const outputDir = join(docsApiDir, pkg).replace(/\\/g, '/')
    const tsEntry = join(packagesDir, pkg, 'src/index.ts')
    const tsxEntry = join(packagesDir, pkg, 'src/index.tsx')
    const entryPoint = (existsSync(tsEntry) ? tsEntry : tsxEntry).replace(/\\/g, '/')
    const tsconfigPath = join(packagesDir, pkg, 'tsconfig.json').replace(/\\/g, '/')

    if (!existsSync(entryPoint)) {
      console.warn(`  ⚠️ 跳过 ${pkg}: 未找到入口文件 ${entryPoint}`)
      continue
    }

    const commandParts = [
      'pnpm exec typedoc',
      `--entryPoints "${entryPoint}"`,
      `--out "${outputDir}"`,
      '--plugin typedoc-plugin-markdown',
      '--hideBreadcrumbs true',
      '--hidePageTitle true',
      '--hidePageHeader true',
      '--entryFileName index.md',
      '--cleanOutputDir true',
      '--readme none',
    ]

    if (existsSync(tsconfigPath)) {
      commandParts.push(`--tsconfig "${tsconfigPath}"`)
    }

    const command = commandParts.join(' ')

    try {
      // 在 Windows 上使用 shell: true 处理 pnpm exec
      execSync(command, { stdio: 'inherit', cwd: root, shell: true })
      console.log(`✅ [${pkg}] 文档生成成功 -> ${outputDir}`)
    } catch {
      console.error(`❌ [${pkg}] 文档生成失败`)
    }
  }

  console.log(`\n✨ 所有 API 文档生成任务完成！`)
}

genApiDocs().catch((err) => {
  console.error('\n❌ 脚本运行出错:', err)
  process.exit(1)
})
