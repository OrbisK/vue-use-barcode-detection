# @orbiks/vueuse-barcode-detection

> Vue composable wrapping Barcode Detection API

[![npm version](https://img.shields.io/npm/v/%40orbiks%2Fvueuse-barcode-detection.svg)](https://www.npmjs.com/package/@orbiks/vueuse-barcode-detection)
[![CI](https://github.com/orbisk/vueuse-barcode-detection/actions/workflows/ci.yml/badge.svg)](https://github.com/orbisk/vueuse-barcode-detection/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Install

```bash
pnpm add @orbiks/vueuse-barcode-detection vue
```

## Use

```ts
import { useCounter } from '@orbiks/vueuse-barcode-detection'

const { count, increment, decrement, reset } = useCounter(0, { min: 0, max: 10 })
```

## Develop

This project uses [Vite+](https://viteplus.dev) (`vp`) — one toolchain that bundles Vite, Vitest, Oxlint, and Oxfmt. Everything is configured in `vite.config.ts`.

```bash
pnpm install

pnpm dev          # boot the playground (Vite dev server)
pnpm test         # vp test in watch mode
pnpm test:run     # single-shot tests for CI
pnpm check        # format + lint + typecheck (vp check)
pnpm fmt          # format with oxfmt
pnpm lint:fix     # autofix with oxlint
pnpm build        # produce the library bundle
pnpm docs:dev     # boot the Nuxt Content docs site (also covers SSR)
```

## Add a new composable

1. Create `src/<useFoo>/index.ts` exporting your function.
2. Add a co-located `<useFoo>/index.test.ts` with Vitest tests.
3. Add a `<useFoo>/demo.vue` so it renders in the playground.
4. Re-export from `src/index.ts`.
5. Add a docs page at `docs/content/functions/<use-foo>.md`. The sidebar picks it up automatically from `queryCollection('docs')`.

## License

[MIT](./LICENSE) © orbisk

> Scaffolded with [`create-vue-composable`](https://github.com/robinkehl/create-vue-composable).
