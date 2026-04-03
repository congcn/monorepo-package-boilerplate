import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

/**
 * 创建标准 Rollup 构建配置，输出 ESM / CJS / IIFE 三种格式及 .d.ts 声明文件。
 *
 * @param {object} options
 * @param {string} [options.input='src/index.ts'] - 入口文件
 * @param {string} options.name - IIFE 格式的全局变量名（如 'MyLib'）
 * @param {string[]} [options.external=[]] - 不打包进产物的外部依赖
 * @returns {import('rollup').RollupOptions[]}
 */
export function createConfig({ input = 'src/index.ts', name, external = [] }) {
  const plugins = [
    resolve({ extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
  ]

  return [
    // ESM
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
    // CJS
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
    // IIFE（内联所有依赖，适合直接在浏览器 <script> 中使用）
    {
      input,
      output: {
        file: 'dist/index.iife.js',
        format: 'iife',
        name,
        sourcemap: true,
      },
      plugins,
    },
    // TypeScript 类型声明
    {
      input,
      output: {
        file: 'dist/index.d.ts',
        format: 'esm',
      },
      plugins: [dts()],
    },
  ]
}
