import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

/**
 * 创建标准 Rollup 构建配置，默认输出 ESM / CJS / .d.ts，支持按需开启 IIFE，
 * 并允许子包注入自定义插件和 globals 配置。
 *
 * @param {object} options
 * @param {string} [options.input='src/index.ts'] - 入口文件
 * @param {string} [options.name] - IIFE 格式的全局变量名（如 'MyLib'）
 * @param {string[]} [options.external=[]] - 不打包进产物的外部依赖
 * @param {boolean} [options.iife=true] - 是否输出 IIFE 格式产物
 * @param {Record<string, string>} [options.globals={}] - IIFE 模式下外部依赖的全局变量映射
 * @param {import('rollup').Plugin[]} [options.plugins=[]] - 追加到基础配置后的自定义 Rollup 插件
 * @returns {import('rollup').RollupOptions[]}
 */
export function createConfig({
  input = 'src/index.ts',
  name,
  external = [],
  iife = true,
  dtsEnabled = true,
  globals = {},
  plugins: extraPlugins = [],
}) {
  const basePlugins = [
    resolve({ extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
  ]

  const plugins = [...basePlugins, ...extraPlugins]

  const configs = [
    {
      input,
      external,
      output: {
        file: 'dist/index.mjs',
        format: 'esm',
        sourcemap: true,
      },
      plugins,
    },
    {
      input,
      external,
      output: {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      plugins,
    },
  ]

  if (iife) {
    configs.push({
      input,
      external,
      output: {
        file: 'dist/index.iife.js',
        format: 'iife',
        name,
        globals,
        sourcemap: true,
      },
      plugins,
    })
  }

  if (dtsEnabled) {
    configs.push({
      input,
      output: {
        file: 'dist/index.d.ts',
        format: 'esm',
      },
      plugins: [dts()],
    })
  }

  return configs
}
