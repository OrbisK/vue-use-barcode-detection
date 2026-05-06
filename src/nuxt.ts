import {
  addComponent,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
  extendViteConfig,
  hasNuxtModule,
  useLogger,
} from '@nuxt/kit'
import { runInstallWizard } from './install-wizard'

const pkgName = '@orbisk/vue-use-barcode-detection'

export interface ModuleOptions {
  /**
   * Register a client plugin that loads the
   * [`barcode-detector`](https://www.npmjs.com/package/barcode-detector)
   * polyfill on demand. The polyfill only patches `globalThis` when
   * `BarcodeDetector` is missing, so native implementations keep winning.
   *
   * Requires `barcode-detector` to be installed in the consumer's project;
   * the install wizard offers to add it the first time the module runs.
   *
   * @default false
   */
  polyfill: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: pkgName,
    configKey: 'barcodeDetection',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  defaults: {
    polyfill: false,
  },
  async onInstall(nuxt) {
    await runInstallWizard(nuxt)
  },
  setup(options) {
    const { resolve } = createResolver(import.meta.url)
    const logger = useLogger(pkgName)

    addImports({
      name: 'useBarcodeDetector',
      from: pkgName,
    })

    addComponent({
      name: 'UseBarcodeDetector',
      export: 'UseBarcodeDetector',
      filePath: pkgName,
    })

    addComponent({
      name: 'BarcodeDetectorOverlay',
      export: 'BarcodeDetectorOverlay',
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

    if (options.polyfill) {
      addPlugin({
        src: resolve('./runtime/plugins/polyfill.client'),
        mode: 'client',
      })
      // Pre-bundle the polyfill so Vite doesn't restart the dev server the
      // first time an unsupported browser triggers the dynamic import.
      extendViteConfig((config) => {
        config.optimizeDeps ??= {}
        config.optimizeDeps.include ??= []
        if (!config.optimizeDeps.include.includes('barcode-detector/polyfill')) {
          config.optimizeDeps.include.push('barcode-detector/polyfill')
        }
      })
      logger.info(
        '`barcode-detector` polyfill plugin registered (loads only when no native BarcodeDetector is present).',
      )
    }
  },
})
