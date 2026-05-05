import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],
  compatibilityDate: '2026-01-01',
  alias: {
    '@orbiks/vue-use-barcode-detection': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
  },
  imports: {
    presets: [
      {
        from: '@orbiks/vue-use-barcode-detection',
        imports: ['useBarcodeDetector'],
      },
    ],
  },
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
  },
})
