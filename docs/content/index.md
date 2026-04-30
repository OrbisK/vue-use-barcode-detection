---
title: '@orbiks/vueuse-barcode-detection'
description: Vue composable wrapping Barcode Detection API
---

# @orbiks/vueuse-barcode-detection

> Vue composable wrapping Barcode Detection API

## Install

```bash
pnpm add @orbiks/vueuse-barcode-detection vue
```

## Use

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useBarcodeDetector } from '@orbiks/vueuse-barcode-detection'

const video = useTemplateRef<HTMLVideoElement>('video')
const { detected } = useBarcodeDetector(video)
</script>

<template>
  <video ref="video" playsinline muted autoplay />
</template>
```

See the [`useBarcodeDetector`](/functions/use-barcode-detector) reference for full options.
