import { createConfig } from '../../rollup.config.base.mjs'

export default createConfig({
  name: '__PACKAGE_NAME__'.replace(/-./g, (x) => x[1].toUpperCase()),
  iife: true,
  external: ['cesium'],
  globals: {
    cesium: 'Cesium',
  },
})
