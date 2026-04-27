import vue from 'rollup-plugin-vue'
import { createConfig } from '../../rollup.config.base.mjs'

export default createConfig({
  name: '__PACKAGE_NAME__'.replace(/^@.*\//, '').replace(/-./g, (x) => x[1].toUpperCase()),
  iife: false,
  external: ['vue'],
  globals: {
    vue: 'Vue',
  },
  plugins: [vue()],
})
