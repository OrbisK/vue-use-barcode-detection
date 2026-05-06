---
seo:
  title: Barcode Detection for Vue & Nuxt
  description: A composable, drop-in scanner component, and polygon overlay for the Barcode Detection API. Vue 3 and Nuxt 4 ready.
---

::u-page-hero
#title
Barcode Detection for Vue & Nuxt

#description
A reactive `useBarcodeDetector` composable, a drop-in `<UseBarcodeDetector />` scanner component, and a `<BarcodeDetectorOverlay />` for drawing polygons over detected codes — plus a Nuxt module that auto-imports them.

#links
:::u-button
---
color: neutral
size: xl
to: /getting-started
trailing-icon: i-lucide-arrow-right
---
Get started
:::

:::u-button
---
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
:::div{class="max-w-3xl mx-auto prose prose-primary dark:prose-invert"}

## Quick start

```bash
pnpm add @orbisk/vue-use-barcode-detection vue @vueuse/core
```

```vue
<script setup lang="ts">
import { UseBarcodeDetector } from '@orbisk/vue-use-barcode-detection'
</script>

<template>
  <UseBarcodeDetector v-slot="{ start, isActive, detected }">
    <button @click="start" :disabled="isActive">Start camera</button>
    <pre>{{ detected }}</pre>
  </UseBarcodeDetector>
</template>
```

Head to [Getting started](/getting-started) for Nuxt setup, the polyfill for non-supporting browsers, and links into the full reference.
:::
::
