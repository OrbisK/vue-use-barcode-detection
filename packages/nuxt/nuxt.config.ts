import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  alias: {
    '@orbisk/vue-use-barcode-detection': fileURLToPath(
      new URL('../../src/index.ts', import.meta.url),
    ),
  },
})
