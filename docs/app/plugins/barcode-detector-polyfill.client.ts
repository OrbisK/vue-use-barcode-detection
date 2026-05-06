// Browsers without a native `BarcodeDetector` (Firefox, Safari, desktop
// Linux Chromium) would otherwise leave every demo on the docs site in the
// "not supported" branch. The polyfill from `barcode-detector` (ZXing
// compiled to wasm) only patches `globalThis` when the API is missing, so
// native implementations keep winning when they exist.
export default defineNuxtPlugin(async () => {
  const isPolyfilled = useState<boolean>('barcode-detector-polyfilled', () => false)
  if ('BarcodeDetector' in window) return
  await import('barcode-detector/polyfill')
  isPolyfilled.value = true
})
