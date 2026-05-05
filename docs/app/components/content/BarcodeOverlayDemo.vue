<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import type { DetectedBarcode } from '@orbisk/vue-use-barcode-detection'
import { useQRCode } from '@vueuse/integrations/useQRCode'

const text = ref('Hello, scanner!')
const prefix = ref('')

// `accept` reads `prefix` on every call so the user can flip the filter
// live without re-mounting the composable. An empty prefix accepts all.
const accept = (b: DetectedBarcode) => !prefix.value || b.rawValue.startsWith(prefix.value)

// QR size is fixed so the overlay's viewBox can be a constant. Reading
// img.naturalWidth in a computed wouldn't work — it's a DOM property,
// not a reactive source, so the computed wouldn't refresh on image load.
const QR_SIZE = 320

// `margin: 4` keeps the QR-spec quiet zone — Chrome's BarcodeDetector
// frequently refuses to lock on QRs with a smaller margin.
const qrSrc = useQRCode(text, {
  width: QR_SIZE,
  margin: 4,
  errorCorrectionLevel: 'M',
})

const img = useTemplateRef<HTMLImageElement>('img')
const { detect, detected, rejected, error, isSupported } = useBarcodeDetector(img, {
  accept,
})

// Re-run detection whenever the QR re-renders OR the prefix changes (so
// rejected/accepted polygons swap colors as the predicate moves).
watch([qrSrc, prefix], () => {
  if (img.value?.complete) void detect()
})

function onLoad() {
  void detect()
}
</script>

<template>
  <ClientOnly>
    <div class="ovl-demo">
      <p v-if="!isSupported" class="ovl-error">
        <code>BarcodeDetector</code> is not available in this browser.
      </p>
      <p v-if="error" class="ovl-error">{{ error.message }}</p>

      <div class="ovl-controls">
        <label>
          QR contents
          <input v-model="text" type="text" placeholder="anything" />
        </label>
        <label>
          Required prefix
          <input v-model="prefix" type="text" placeholder="(any)" />
        </label>
      </div>

      <p class="ovl-hint">
        Type a prefix the value must start with — e.g.
        <button type="button" class="ovl-chip" @click="prefix = 'vue:'">vue:</button>
        — then change the QR contents above. Matching codes draw in green; non-matching ones draw in
        red so you can see exactly what the predicate filtered out.
      </p>

      <div class="ovl-stage">
        <img v-if="qrSrc" ref="img" :src="qrSrc" alt="generated QR code" @load="onLoad" />
        <BarcodeDetectorOverlay
          :detected="detected"
          :rejected="rejected"
          :view-box="`0 0 ${QR_SIZE} ${QR_SIZE}`"
        />
      </div>

      <ul class="ovl-results">
        <li v-for="(b, i) in detected" :key="`a-${i}`">
          <span class="ovl-dot ovl-dot--accepted" />
          <strong>accepted</strong> — <code>{{ b.rawValue }}</code>
        </li>
        <li v-for="(b, i) in rejected" :key="`r-${i}`" class="ovl-muted">
          <span class="ovl-dot ovl-dot--rejected" />
          <strong>rejected</strong> — <code>{{ b.rawValue }}</code>
        </li>
        <li v-if="!detected.length && !rejected.length" class="ovl-muted">
          Nothing detected yet — try changing the QR contents.
        </li>
      </ul>
    </div>
  </ClientOnly>
</template>

<style scoped>
.ovl-demo {
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.ovl-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}
.ovl-controls label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.ovl-controls input {
  padding: 0.4rem 0.6rem;
  border: 1px solid rgb(from currentColor r g b / 0.2);
  border-radius: 0.375rem;
  background: transparent;
  color: inherit;
  font: inherit;
  min-width: 14rem;
}
.ovl-hint {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0.25rem 0 0.75rem;
}
.ovl-chip {
  padding: 0 0.4rem;
  border: 1px solid rgb(from currentColor r g b / 0.25);
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-family: ui-monospace, monospace;
  cursor: pointer;
}
.ovl-stage {
  position: relative;
  display: inline-block;
  background: #fff;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(from currentColor r g b / 0.1);
}
.ovl-stage img {
  display: block;
  width: 320px;
  height: 320px;
  image-rendering: pixelated;
}
.ovl-results {
  margin-top: 1rem;
  padding: 0;
  list-style: none;
  font-family: ui-monospace, monospace;
  font-size: 0.9rem;
}
.ovl-results li {
  padding: 0.25rem 0;
  border-bottom: 1px solid rgb(from currentColor r g b / 0.1);
  word-break: break-all;
}
.ovl-dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 9999px;
  vertical-align: middle;
  margin-right: 0.4rem;
}
.ovl-dot--accepted {
  background: rgb(0, 200, 120);
}
.ovl-dot--rejected {
  background: rgb(220, 60, 60);
}
.ovl-muted {
  opacity: 0.7;
}
.ovl-error {
  color: crimson;
}
</style>
