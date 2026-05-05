import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@orbisk/vue-use-barcode-detection/nuxt'],
  compatibilityDate: '2026-01-01',
  alias: {
    '@orbisk/vue-use-barcode-detection': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    '@orbisk/vue-use-barcode-detection/nuxt': fileURLToPath(
      new URL('../src/nuxt.ts', import.meta.url),
    ),
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/core',
        '@orbisk/vue-use-barcode-detection',
      ],
    },
  },
})
