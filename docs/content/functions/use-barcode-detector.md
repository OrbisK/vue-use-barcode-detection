---
title: useBarcodeDetector
description: Reactive wrapper around the Barcode Detection API.
---

# useBarcodeDetector

Reactive wrapper around the [Barcode Detection API](https://developer.mozilla.org/docs/Web/API/Barcode_Detection_API).

Accepts any source `BarcodeDetector#detect` understands: `HTMLImageElement`, `SVGImageElement`, `HTMLVideoElement`, `HTMLCanvasElement`, `ImageBitmap`, `OffscreenCanvas`, `VideoFrame`, `Blob`, `ImageData`.

For an `HTMLVideoElement` source, manages a `getUserMedia` stream and runs detection on each animation frame. For any other source, runs detection whenever the source ref changes (with `immediate: true`) or on demand via `detect()`.

## Usage

### Live camera

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useBarcodeDetector } from '@orbiks/vueuse-barcode-detection'

const video = useTemplateRef<HTMLVideoElement>('video')
const { isSupported, supportedFormats, detected, error } = useBarcodeDetector(video)
</script>

<template>
  <video ref="video" playsinline muted autoplay />
</template>
```

### Static image

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useBarcodeDetector } from '@orbiks/vueuse-barcode-detection'

const img = useTemplateRef<HTMLImageElement>('img')
const { detected } = useBarcodeDetector(img)
</script>

<template>
  <img ref="img" src="/barcode.png" alt="" />
</template>
```

### Manual detection on a Blob

```ts
const { detect } = useBarcodeDetector()
const file = await fetch('/barcode.png').then((r) => r.blob())
const result = await detect(file)
```

## Options

| Name        | Type                               | Default                            | Description                                                                                                                                                  |
| ----------- | ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `formats`   | `BarcodeFormat[]`                  | _all formats supported by browser_ | Restrict detection to specific formats.                                                                                                                      |
| `immediate` | `boolean`                          | `true`                             | Auto-start (camera for video sources, run `detect()` on change otherwise) once the source is available.                                                      |
| `camera`    | `boolean \| MediaTrackConstraints` | `true`                             | For video sources: `true` calls `getUserMedia` with rear camera; pass constraints to override; `false` skips camera setup so you can supply your own stream. |
| `window`    | `Window`                           | `defaultWindow`                    | Custom `window` reference (SSR / iframe).                                                                                                                    |

## Returns

| Name               | Type                                                                  | Description                                                              |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `isSupported`      | `ComputedRef<boolean>`                                                | Whether `BarcodeDetector` exists on `window`.                            |
| `supportedFormats` | `ShallowRef<BarcodeFormat[]>`                                         | Formats reported by the browser once the detector is created.            |
| `detected`         | `ShallowRef<DetectedBarcode[]>`                                       | Latest detection result.                                                 |
| `error`            | `ShallowRef<Error \| null>`                                           | Set when permission is denied or the API is unavailable.                 |
| `isActive`         | `ShallowRef<boolean>`                                                 | Whether the camera + detection loop is running (video sources only).     |
| `detect`           | `(source?: BarcodeImageSource \| null) => Promise<DetectedBarcode[]>` | Run a single detection. Falls back to the configured source ref.         |
| `start`            | `() => Promise<void>`                                                 | Start the camera stream and detection loop. No-op for non-video sources. |
| `stop`             | `() => void`                                                          | Stop the loop and release the media stream.                              |
