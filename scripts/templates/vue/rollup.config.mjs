import vue from 'rollup-plugin-vue'
import { createConfig } from '../../rollup.config.base.mjs'

export default createConfig({
  name: '__PACKAGE_NAME__'.replace(/-./g, (x) => x[1].toUpperCase()),
  iife: false,
  dtsEnabled: false,
  external: ['vue'],
  globals: {
    vue: 'Vue',
  },
  plugins: [vue()],
})
