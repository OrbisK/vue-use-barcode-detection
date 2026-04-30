import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  compatibilityDate: '2026-01-01',
  // Opt in so postinstall `nuxi prepare` doesn't block on the consent prompt.
  telemetry: true,
  alias: {
    '@orbiks/vueuse-barcode-detection': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
  },
  imports: {
    presets: [
      {
        from: '@orbiks/vueuse-barcode-detection',
        imports: ['useBarcodeDetector'],
      },
    ],
  },
  typescript: {
    typeCheck: false,
    strict: true,
  },
  app: {
    head: {
      title: '@orbiks/vueuse-barcode-detection',
      meta: [{ name: 'description', content: 'Vue composable wrapping Barcode Detection API' }],
    },
  },
})
