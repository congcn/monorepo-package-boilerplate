import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(import.meta.url), '../..')
const packagesDir = join(root, 'packages')

if (!existsSync(packagesDir)) {
  console.log('No packages found to build.')
  process.exit(0)
}

const packages = readdirSync(packagesDir).filter((name) =>
  existsSync(join(packagesDir, name, 'package.json')),
)

if (packages.length === 0) {
  console.log('No packages found to build.')
  process.exit(0)
}

for (const pkg of packages) {
  console.log(`\nBuilding ${pkg}...`)
  execSync('pnpm rollup -c', {
    cwd: join(packagesDir, pkg),
    stdio: 'inherit',
  })
}

console.log('\nAll packages built successfully.')
