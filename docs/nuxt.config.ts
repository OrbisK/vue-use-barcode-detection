import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxt/ui', '@orbisk/nuxt-barcode-detection'],
  barcodeDetection: {
    polyfill: true,
  },
  compatibilityDate: '2026-01-01',
  css: ['~/assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/core',
        '@vueuse/integrations/useQRCode',
      ],
      // Keep the workspace package out of the pre-bundle. Otherwise Vite
      // freezes its export list at first dev-server start, and any new
      // export (e.g. BarcodeDetectorOverlay) shipped by `vp pack` looks
      // missing until the cache under `node_modules/.cache/vite` is wiped.
      exclude: ['@orbisk/vue-use-barcode-detection'],
    },
  },
})
