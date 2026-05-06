# @orbisk/vue-use-barcode-detection

> Vue composable, drop-in scanner component, and polygon overlay for the [Barcode Detection API](https://developer.mozilla.org/docs/Web/API/Barcode_Detection_API). Vue 3 and Nuxt 4 ready.

[![npm version](https://img.shields.io/npm/v/%40orbisk%2Fvue-use-barcode-detection.svg)](https://www.npmjs.com/package/@orbisk/vue-use-barcode-detection)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-live-blue.svg)](https://orbisk.github.io/vue-use-barcode-detection/)

📖 **[Full documentation & live demos →](https://orbisk.github.io/vue-use-barcode-detection/)**

## What you get

- **`useBarcodeDetector`** — reactive composable. Manages a `getUserMedia` stream + RAF detection loop for `<video>` sources, or runs detection on demand for images / canvases / blobs.
- **`<UseBarcodeDetector />`** — drop-in scanner component. `<video>` + camera + polygon overlay in one tag, with slots for custom UI.
- **`<BarcodeDetectorOverlay />`** — standalone SVG overlay drawing accepted (green) and rejected (red) barcode polygons over any source.
- **[`@orbisk/nuxt-barcode-detection`](./packages)** — Nuxt module: auto-imports the composable, registers the components globally, and ships an opt-in client polyfill plugin. Adds `<UBarcodeInput />` (input + scan modal) when [`@nuxt/ui`](https://ui.nuxt.com) is present.

## Install

```bash
pnpm add @orbisk/vue-use-barcode-detection vue @vueuse/core
```

Requires **Vue 3.5+** and **`@vueuse/core` 14+** (peer dependencies).

## Vue

The wrapper component is the fastest path — `<video>`, camera stream, and polygon overlay are wired up for you. `start()` must run from a user gesture (e.g. a click) so Safari/iOS will allow `getUserMedia` and `video.play()`.

```vue
<script setup lang="ts">
import { UseBarcodeDetector } from '@orbisk/vue-use-barcode-detection'
</script>

<template>
  <UseBarcodeDetector v-slot="{ start, stop, isActive, detected }">
    <button @click="isActive ? stop() : start()">
      {{ isActive ? 'Stop' : 'Start camera' }}
    </button>
    <ul>
      <li v-for="b in detected" :key="b.rawValue">
        <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
      </li>
    </ul>
  </UseBarcodeDetector>
</template>
```

Reach for the composable when you need full control over the source element:

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
</template>
```

The composable accepts any source `BarcodeDetector#detect` understands: `HTMLVideoElement`, `HTMLImageElement`, `SVGImageElement`, `HTMLCanvasElement`, `ImageBitmap`, `OffscreenCanvas`, `VideoFrame`, `Blob`, `ImageData`.

### Key options

| Option      | Type                                             | Default | Description                                                                                                                                                  |
| ----------- | ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `formats`   | `MaybeRefOrGetter<BarcodeFormat[] \| undefined>` | _all_   | Restrict detection to specific formats. Reactive — the underlying `BarcodeDetector` is rebuilt on change.                                                    |
| `immediate` | `boolean`                                        | `false` | Auto-start once the source is available. Defaults to `false` because `getUserMedia` / `video.play()` need a user gesture in Safari/iOS.                      |
| `camera`    | `boolean \| MediaTrackConstraints`               | `true`  | For video sources. `true` calls `getUserMedia` with rear camera; pass constraints to override; `false` skips camera setup so you can supply your own stream. |
| `once`      | `MaybeRefOrGetter<boolean>`                      | `false` | Stop after the first accepted detection. Pair with `accept` to stop only on matching barcodes. Call `start()` to re-arm.                                     |
| `accept`    | `(b: DetectedBarcode) => boolean`                | _none_  | Predicate gating which detections count. Non-matching barcodes go to `rejected` instead of `detected` and don't trigger `once`.                              |

The composable returns `isSupported`, `supportedFormats`, `detected`, `rejected`, `error`, `isActive`, `detect()`, `start()`, `stop()`. See the [`useBarcodeDetector` reference](https://orbisk.github.io/vue-use-barcode-detection/functions/use-barcode-detector) for the full API, reactive options, the `headless` mode, and the `<BarcodeDetectorOverlay />` props.

### Scan once / filter scans

```ts
// Stop the camera on the first QR code
useBarcodeDetector(video, {
  once: true,
  accept: (b) => b.format === 'qr_code',
})
```

`accept` filters `detected` itself — non-matching barcodes appear in `rejected` instead, never trigger `once`, and (in `<UseBarcodeDetector />`) are drawn in red so users see _why_ a scan was ignored.

## Nuxt

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@orbisk/nuxt-barcode-detection'],
})
```

`useBarcodeDetector` becomes an auto-import; `<UseBarcodeDetector />` and `<BarcodeDetectorOverlay />` are registered globally. When `@nuxt/ui` is also installed, the module additionally registers `<UBarcodeInput />` — a `UInput` paired with a scan button that opens a live-camera modal.

```vue [pages/scan.vue]
<template>
  <UseBarcodeDetector v-slot="{ detected }">
    <pre>{{ detected }}</pre>
  </UseBarcodeDetector>
</template>
```

See the [Nuxt module docs](https://orbisk.github.io/vue-use-barcode-detection/nuxt) and the [Nuxt UI integration](https://orbisk.github.io/vue-use-barcode-detection/nuxt/nuxt-ui) for module options, `<UBarcodeInput />` props, and the install wizard.

## Browser support & polyfill

The Barcode Detection API is part of the Shape Detection family — natively wired up on Chromium for ChromeOS, macOS, and Android. Desktop Linux Chromium, Firefox, and Safari ship the engine without the platform-side decoder.

For full coverage, drop in the [`barcode-detector`](https://www.npmjs.com/package/barcode-detector) polyfill — a ZXing-based wasm fallback that only patches `globalThis.BarcodeDetector` when missing.

```bash
pnpm add barcode-detector
```

```ts [main.ts]
if (typeof window !== 'undefined' && !('BarcodeDetector' in window)) {
  await import('barcode-detector/polyfill')
}
```

In Nuxt, set `barcodeDetection.polyfill: true` (the install wizard offers this on first run) and the module ships a client plugin that loads the polyfill on demand. Both the composable and the wrapper component expose `isSupported` so you can render a fallback UI when neither native nor polyfill is available.

See [Compatibility & polyfill](https://orbisk.github.io/vue-use-barcode-detection/compatibility) for the full browser support table and Nuxt wiring.

## Develop

This project uses [Vite+](https://viteplus.dev) (`vp`) — one toolchain that bundles Vite, Vitest, Oxlint, and Oxfmt. Everything is configured in `vite.config.ts`.

```bash
pnpm install
pnpm dev:prepare  # generate the Nuxt module's dev stub (required before docs:dev / typecheck)

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
