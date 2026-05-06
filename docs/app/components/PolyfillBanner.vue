<script setup lang="ts">
const isPolyfilled = useState<boolean>('barcode-detector-polyfilled', () => false)
</script>

<template>
  <ClientOnly>
    <UAlert
      v-if="isPolyfilled"
      icon="i-lucide-info"
      color="info"
      variant="subtle"
      title="Running on the BarcodeDetector polyfill"
      description="Your browser doesn't ship a native Barcode Detection API. Demos on this site use the WebAssembly polyfill from `barcode-detector`."
      :actions="[
        {
          label: 'Compatibility & polyfill',
          to: '/compatibility',
          icon: 'i-lucide-arrow-right',
          color: 'info',
          variant: 'soft',
        },
      ]"
      class="my-4"
    />
  </ClientOnly>
</template>
