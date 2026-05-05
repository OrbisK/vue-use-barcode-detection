---
seo:
  title: '@orbisk/vue-use-barcode-detection'
  description: Vue composable wrapping the Barcode Detection API.
---

::u-page-hero
#title
Vue composable wrapping the Barcode Detection API

#description
A reactive `useBarcodeDetector` and a drop-in `<UseBarcodeDetector />` component for scanning QR codes and barcodes in Vue 3.

#links
:::u-button

---

color: neutral
size: xl
to: /functions/use-barcode-detector
trailing-icon: i-lucide-arrow-right

---

Get started
:::

## :::u-button

color: neutral
icon: simple-icons-github
size: xl
to: https://github.com/orbisk/vueuse-barcode-detection
variant: outline

---

Star on GitHub
:::
::

::u-container{class="py-16 sm:py-24"}
::div{class="max-w-3xl mx-auto prose prose-primary dark:prose-invert"}

## Install

Add the package and its peer `vue` to your project.

```bash
pnpm add @orbisk/vue-use-barcode-detection vue
```

## Use

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useBarcodeDetector } from '@orbisk/vue-use-barcode-detection'

const video = useTemplateRef<HTMLVideoElement>('video')
const { detected } = useBarcodeDetector(video)
</script>

<template>
  <video ref="video" playsinline muted autoplay />
</template>
```

See the [`useBarcodeDetector`](/functions/use-barcode-detector) reference for full options.
::
::
