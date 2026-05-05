<script setup lang="ts">
import { useMounted, useSupported } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  type BarcodeFormat,
  type DetectedBarcode,
  type UseBarcodeDetectorOptions,
  useBarcodeDetector,
} from '@orbisk/vue-use-barcode-detection'

const props = withDefaults(
  defineProps<{
    formats?: BarcodeFormat[]
    /**
     * Stop scanning after the first detection. Defaults to `true` so the modal
     * closes immediately on a hit. Pass a predicate to filter (e.g. by format).
     */
    once?: UseBarcodeDetectorOptions['once']
    placeholder?: string
    /** Accessible label + modal title for the scan button. */
    scanLabel?: string
    /** Icon for the scan button. Pass any name your Nuxt UI iconset exposes. */
    icon?: string
  }>(),
  {
    once: true,
    scanLabel: 'Scan barcode',
    icon: 'i-lucide-scan-line',
  },
)

const value = defineModel<string>({ default: '' })

const emit = defineEmits<{
  scan: [DetectedBarcode]
}>()

const open = ref(false)
const video = shallowRef<HTMLVideoElement | null>(null)

// Match `UseBarcodeDetector`'s SSR strategy: emit `false` during SSR and the
// client's first render, then flip after hydration so the trailing button
// doesn't cause a hydration mismatch.
const isMounted = useMounted()
const apiSupported = useSupported(
  () => typeof window !== 'undefined' && 'BarcodeDetector' in window,
)
const isSupported = computed(() => isMounted.value && apiSupported.value)

const { detected, error, stop } = useBarcodeDetector(video, {
  formats: props.formats,
  immediate: true,
  once: props.once,
})

watch(detected, (list) => {
  if (!list.length) return
  const first = list[0]!
  value.value = first.rawValue
  emit('scan', first)
  open.value = false
})

watch(open, (isOpen) => {
  if (!isOpen) stop()
})
</script>

<template>
  <UInput v-model="value" :placeholder="placeholder">
    <template v-if="isSupported" #trailing>
      <UModal v-model:open="open" :title="scanLabel">
        <UButton
          :icon="icon"
          color="neutral"
          variant="ghost"
          size="sm"
          square
          :aria-label="scanLabel"
        />
        <template #body>
          <div v-if="open" class="ubd-input__stage">
            <video ref="video" playsinline muted autoplay class="ubd-input__video" />
            <p v-if="error" class="ubd-input__error">{{ error.message }}</p>
          </div>
        </template>
      </UModal>
    </template>
  </UInput>
</template>

<style scoped>
.ubd-input__stage {
  position: relative;
  width: 100%;
}
.ubd-input__video {
  width: 100%;
  display: block;
  border-radius: 0.5rem;
}
.ubd-input__error {
  margin-top: 0.5rem;
  color: crimson;
  font-size: 0.875rem;
}
</style>
