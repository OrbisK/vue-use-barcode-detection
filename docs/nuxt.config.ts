import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxt/ui', '@orbisk/vue-use-barcode-detection/nuxt'],
  compatibilityDate: '2026-01-01',
  css: ['~/assets/css/main.css'],
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
