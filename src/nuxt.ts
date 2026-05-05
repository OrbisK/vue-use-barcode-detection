import {
  addComponent,
  addImports,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
} from '@nuxt/kit'

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
    const { resolve } = createResolver(import.meta.url)

    addImports({
      name: 'useBarcodeDetector',
      from: pkgName,
    })

    addComponent({
      name: 'UseBarcodeDetector',
      export: 'UseBarcodeDetector',
      filePath: pkgName,
    })

    // Nuxt-UI-dependent components: register only when @nuxt/ui is installed.
    // The SFC is shipped as a raw `.vue` file under `runtime/` so the
    // consumer's Nuxt build runs its template scanner over it and resolves
    // `<UInput>`, `<UButton>`, `<UModal>` through Nuxt UI's auto-imports.
    if (hasNuxtModule('@nuxt/ui')) {
      addComponent({
        name: 'UBarcodeInput',
        filePath: resolve('./runtime/components/UBarcodeInput.vue'),
      })
    }
  },
})
