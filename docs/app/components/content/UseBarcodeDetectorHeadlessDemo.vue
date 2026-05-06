<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import type { DetectedBarcode, UseBarcodeDetectorReturn } from '@orbisk/vue-use-barcode-detection'
import { useQRCode } from '@vueuse/integrations/useQRCode'

const text = ref('Hello, headless!')
const prefix = ref('')

const accept = (b: DetectedBarcode) => !prefix.value || b.rawValue.startsWith(prefix.value)

const qrSrc = useQRCode(text, {
  width: 320,
  margin: 4,
  errorCorrectionLevel: 'M',
})

// The wrapper exposes the composable's return — grab `detect()` so we can
// re-run it when only the predicate changes (the `<img>` ref is unchanged
// in that case, so the composable's source watcher wouldn't fire).
const scanner = useTemplateRef<UseBarcodeDetectorReturn>('scanner')
watch(prefix, () => void scanner.value?.detect())
</script>

<template>
  <ClientOnly>
    <UseBarcodeDetector
      ref="scanner"
      headless
      immediate
      :accept="accept"
      v-slot="{ setSource, source, detect, detected, rejected, error, isSupported }"
    >
      <div class="ubdh-demo">
        <p v-if="!isSupported" class="ubdh-error">
          <code>BarcodeDetector</code> is not available in this browser.
        </p>
        <p v-if="error" class="ubdh-error">{{ error.message }}</p>

        <div class="ubdh-controls">
          <label>
            QR contents
            <input v-model="text" type="text" placeholder="anything" />
          </label>
          <label>
            Required prefix
            <input v-model="prefix" type="text" placeholder="(any)" />
          </label>
        </div>

        <p class="ubdh-hint">
          The wrapper renders headlessly — the
          <code>&lt;img&gt;</code> below is bound via <code>setSource</code>, and
          <code>immediate</code> tells the composable to run <code>detect()</code> whenever the
          source changes. Try
          <button type="button" class="ubdh-chip" @click="prefix = 'vue:'">vue:</button>
          as a prefix.
        </p>

        <div class="ubdh-stage">
          <img
            v-if="qrSrc"
            :ref="setSource"
            :src="qrSrc"
            alt="generated QR code"
            @load="detect()"
          />
          <BarcodeDetectorOverlay
            :detected="detected"
            :rejected="rejected"
            :source="source"
            :label="(b, accepted) => (accepted ? b.rawValue : 'invalid')"
            :label-font-size="22"
          />
        </div>

        <ul class="ubdh-results">
          <li v-for="(b, i) in detected" :key="`a-${i}`">
            <span class="ubdh-dot ubdh-dot--accepted" />
            <strong>accepted</strong> — <code>{{ b.rawValue }}</code>
          </li>
          <li v-for="(b, i) in rejected" :key="`r-${i}`" class="ubdh-muted">
            <span class="ubdh-dot ubdh-dot--rejected" />
            <strong>rejected</strong> — <code>{{ b.rawValue }}</code>
          </li>
          <li v-if="!detected.length && !rejected.length" class="ubdh-muted">
            Nothing detected yet — try changing the QR contents.
          </li>
        </ul>
      </div>
    </UseBarcodeDetector>
  </ClientOnly>
</template>

<style scoped>
.ubdh-demo {
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.ubdh-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}
.ubdh-controls label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.ubdh-controls input {
  padding: 0.4rem 0.6rem;
  border: 1px solid rgb(from currentColor r g b / 0.2);
  border-radius: 0.375rem;
  background: transparent;
  color: inherit;
  font: inherit;
  min-width: 14rem;
}
.ubdh-hint {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0.25rem 0 0.75rem;
}
.ubdh-chip {
  padding: 0 0.4rem;
  border: 1px solid rgb(from currentColor r g b / 0.25);
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-family: ui-monospace, monospace;
  cursor: pointer;
}
.ubdh-stage {
  position: relative;
  display: inline-block;
  background: #fff;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(from currentColor r g b / 0.1);
}
.ubdh-stage img {
  display: block;
  width: 320px;
  height: 320px;
  image-rendering: pixelated;
}
.ubdh-results {
  margin-top: 1rem;
  padding: 0;
  list-style: none;
  font-family: ui-monospace, monospace;
  font-size: 0.9rem;
}
.ubdh-results li {
  padding: 0.25rem 0;
  border-bottom: 1px solid rgb(from currentColor r g b / 0.1);
  word-break: break-all;
}
.ubdh-dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 9999px;
  vertical-align: middle;
  margin-right: 0.4rem;
}
.ubdh-dot--accepted {
  background: rgb(0, 200, 120);
}
.ubdh-dot--rejected {
  background: rgb(220, 60, 60);
}
.ubdh-muted {
  opacity: 0.7;
}
.ubdh-error {
  color: crimson;
}
</style>
