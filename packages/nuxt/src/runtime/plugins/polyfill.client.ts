import { defineNuxtPlugin, useState } from '#app'

export default defineNuxtPlugin(async () => {
  const isPolyfilled = useState<boolean>('barcode-detector-polyfilled', () => false)
  if ('BarcodeDetector' in window) return
  await import('barcode-detector/polyfill')
  isPolyfilled.value = true
})
