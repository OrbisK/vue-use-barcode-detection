<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useBarcodeDetector } from '@orbisk/vueuse-barcode-detection'

const video = useTemplateRef<HTMLVideoElement>('video')
const { isSupported, supportedFormats, detected, error, isActive, start, stop } =
  useBarcodeDetector(video)
</script>

<template>
  <ClientOnly>
    <div class="ubd-demo">
      <p v-if="!isSupported" class="ubd-error">
        <code>BarcodeDetector</code> is not available in this browser.
      </p>
      <p v-if="error" class="ubd-error">{{ error.message }}</p>
      <p class="ubd-formats">
        Supported formats: <code>{{ supportedFormats.join(', ') || '—' }}</code>
      </p>

      <div class="ubd-stage">
        <video ref="video" playsinline muted />
        <svg
          v-if="detected.length"
          class="ubd-overlay"
          :viewBox="`0 0 ${video?.videoWidth ?? 0} ${video?.videoHeight ?? 0}`"
          preserveAspectRatio="xMidYMid slice"
        >
          <polygon
            v-for="(b, i) in detected"
            :key="i"
            :points="b.cornerPoints.map((p) => `${p.x},${p.y}`).join(' ')"
            class="ubd-box"
          />
        </svg>
        <button
          v-if="!isActive"
          type="button"
          class="ubd-start"
          :disabled="!isSupported"
          @click="start"
        >
          Start camera
        </button>
      </div>

      <div class="ubd-controls">
        <button v-if="isActive" type="button" class="ubd-btn" @click="stop">Stop</button>
      </div>

      <ul class="ubd-results">
        <li v-for="(b, i) in detected" :key="i">
          <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
        </li>
        <li v-if="!detected.length" class="ubd-muted">
          {{
            isActive
              ? 'No barcode detected yet — point the camera at one.'
              : 'Press “Start camera” to begin scanning.'
          }}
        </li>
      </ul>
    </div>
  </ClientOnly>
</template>

<style scoped>
.ubd-demo {
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.ubd-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 0.5rem;
}
.ubd-stage video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ubd-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.ubd-box {
  fill: rgba(0, 200, 120, 0.15);
  stroke: rgb(0, 200, 120);
  stroke-width: 4;
}
.ubd-start {
  position: absolute;
  inset: 0;
  margin: auto;
  width: max-content;
  height: max-content;
  padding: 0.6rem 1.1rem;
  border-radius: 9999px;
  border: 0;
  background: rgb(0, 200, 120);
  color: #000;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.ubd-start[disabled] {
  background: #555;
  color: #ccc;
  cursor: not-allowed;
}
.ubd-controls {
  margin-top: 0.5rem;
  min-height: 2rem;
}
.ubd-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 0.375rem;
  border: 1px solid rgb(from currentColor r g b / 0.2);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.ubd-results {
  margin-top: 1rem;
  padding: 0;
  list-style: none;
  font-family: ui-monospace, monospace;
  font-size: 0.9rem;
}
.ubd-results li {
  padding: 0.25rem 0;
  border-bottom: 1px solid rgb(from currentColor r g b / 0.1);
  word-break: break-all;
}
.ubd-muted {
  opacity: 0.6;
}
.ubd-error {
  color: crimson;
}
.ubd-formats {
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>
