import { addComponent, addImports, defineNuxtModule } from '@nuxt/kit'

const pkgName = '@orbisk/vue-use-barcode-detection'

export default defineNuxtModule({
  meta: {
    name: pkgName,
    configKey: 'barcodeDetection',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  setup() {
    addImports({
      name: 'useBarcodeDetector',
      from: pkgName,
    })

    addComponent({
      name: 'UseBarcodeDetector',
      export: 'UseBarcodeDetector',
      filePath: pkgName,
    })
  },
})
