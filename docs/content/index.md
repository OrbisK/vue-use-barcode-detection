---
title: '@orbisk/vue-use-barcode-detection'
description: Vue composable wrapping Barcode Detection API
---

# @orbisk/vue-use-barcode-detection

> Vue composable wrapping Barcode Detection API

## Install

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
