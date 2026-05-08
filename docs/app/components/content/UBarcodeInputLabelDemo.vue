<script setup lang="ts">
import { ref } from 'vue'

const value = ref('')
</script>

<template>
  <ClientOnly>
    <UBarcodeInput v-model="value" placeholder="Enter or scan a code" :ui="{ base: 'pe-24' }">
      <template #button-default>Scan me</template>
    </UBarcodeInput>
  </ClientOnly>
</template>
