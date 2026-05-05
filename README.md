# @orbisk/vue-use-barcode-detection

> Vue composable wrapping Barcode Detection API

[![npm version](https://img.shields.io/npm/v/%40orbisk%2Fvue-use-barcode-detection.svg)](https://www.npmjs.com/package/@orbisk/vue-use-barcode-detection)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Install

```bash
pnpm add @orbisk/vue-use-barcode-detection vue @vueuse/core
```

`vue` and `@vueuse/core` are peer dependencies — install them alongside the package.

## Use

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useBarcodeDetector } from '@orbisk/vue-use-barcode-detection'

const video = useTemplateRef<HTMLVideoElement>('video')
const { isSupported, detected, error, isActive, start, stop } = useBarcodeDetector(video)
</script>

<template>
  <p v-if="!isSupported">BarcodeDetector is not available in this browser.</p>
  <p v-else-if="error">{{ error.message }}</p>

  <video ref="video" playsinline muted />
  <button @click="isActive ? stop() : start()">
    {{ isActive ? 'Stop' : 'Start camera' }}
  </button>

  <ul>
    <li v-for="(b, i) in detected" :key="i">
      <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
    </li>
  </ul>
</template>
```

> Camera access requires a secure context (HTTPS or `localhost`) and user permission. `start()` must run from a user gesture (e.g. a click) so Safari/iOS will allow `getUserMedia` and `video.play()`.

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
