<script setup lang="ts">
import { ref } from 'vue'
import type { DetectedBarcode } from '@orbisk/vue-use-barcode-detection'

const value = ref('')
const lastFormat = ref<string | null>(null)

function onScan(barcode: DetectedBarcode) {
  lastFormat.value = barcode.format
}
</script>

<template>
  <ClientOnly>
    <div class="ubd-input-demo">
      <UBarcodeInput
        v-model="value"
        placeholder="Type a value or tap the icon to scan"
        class="w-full"
        @scan="onScan"
      />
      <p class="ubd-input-demo__meta">
        <span>
          Current value:
          <code>{{ value || '—' }}</code>
        </span>
        <span v-if="lastFormat">
          Last format: <code>{{ lastFormat }}</code>
        </span>
      </p>
    </div>
  </ClientOnly>
</template>

<style scoped>
.ubd-input-demo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ubd-input-demo__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  opacity: 0.8;
}
</style>
