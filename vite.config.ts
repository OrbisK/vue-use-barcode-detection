import { fileURLToPath } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite-plus'

// `vp pack` handles library bundling (tsdown under the hood, generates .d.mts).
// `vp dev playground` boots the playground (uses playground/index.html as entry).
// `vp test`, `vp lint`, `vp fmt` read the config blocks below.
export default defineConfig({
  plugins: [Vue(), basicSsl()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@orbisk/vue-use-barcode-detection': fileURLToPath(
        new URL('./src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.d.ts'],
    },
  },
  lint: {
    ignorePatterns: ['dist/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ['docs/content/**/*.md'],
    singleQuote: true,
    semi: false,
  },
  staged: { '*': 'vp check --fix' },
})
