<script setup lang="ts">
import { ref, watch } from 'vue'
import { Mask } from 'maska'

const m = new Mask({ mask: '#-###-#####-####' })
const value = ref('')

watch(value, (v) => {
  const next = m.masked(v)
  if (next !== v) value.value = next
})
</script>

<template>
  <ClientOnly>
    <UFormField label="GTIN-13" help="Format: 1-234-56789-0123 — type or scan a 13-digit code.">
      <UBarcodeInput v-model="value" placeholder="0-000-00000-0000" class="w-full" />
    </UFormField>
  </ClientOnly>
</template>
