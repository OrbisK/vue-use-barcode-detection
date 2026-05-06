<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { BarcodeDetectorOverlay, useBarcodeDetector } from '@orbisk/vue-use-barcode-detection'

const video = useTemplateRef<HTMLVideoElement>('video')
const { isSupported, supportedFormats, detected, error } = useBarcodeDetector(video)
</script>

<template>
  <div class="demo">
    <p v-if="!isSupported" class="error">
      <code>BarcodeDetector</code> is not available in this browser.
    </p>
    <p v-if="error" class="error">{{ error.message }}</p>
    <p>
      Supported formats: <code>{{ supportedFormats.join(', ') || '—' }}</code>
    </p>

    <div class="stage">
      <video ref="video" playsinline muted autoplay />
      <BarcodeDetectorOverlay :detected="detected" :source="video" />
    </div>

    <ul class="results">
      <li v-for="(b, i) in detected" :key="i">
        <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
      </li>
      <li v-if="!detected.length" class="muted">
        No barcode detected yet — point the camera at one.
      </li>
    </ul>
  </div>
</template>

<style scoped>
.demo {
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}
.stage video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.results {
  margin-top: 1rem;
  padding: 0;
  list-style: none;
  font-family: ui-monospace, monospace;
  font-size: 0.9rem;
}
.results li {
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
  word-break: break-all;
}
.muted {
  color: #888;
}
.error {
  color: crimson;
}
</style>
