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

// Drive `start`/`stop` manually so reopening the modal re-arms the camera.
// `immediate: true` would only fire once on initial mount.
const { detected, error, start, stop } = useBarcodeDetector(video, {
  formats: props.formats,
  once: props.once,
})

watch(video, (el) => {
  if (el && open.value) void start()
})

watch(detected, (list) => {
  if (!list.length) return
  const first = list[0]!
  value.value = first.rawValue
  emit('scan', first)
  open.value = false
})
</script>

<template>
  <UFieldGroup class="w-full">
    <UInput v-model="value" :placeholder="placeholder" class="flex-1" />
    <UModal v-if="isSupported" v-model:open="open" :title="scanLabel" @after:leave="stop">
      <UButton :icon="icon" color="neutral" variant="subtle" square :aria-label="scanLabel" />
      <template #body>
        <div v-if="open" class="relative w-full">
          <video ref="video" playsinline muted autoplay class="block w-full rounded-lg" />
          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :title="error.name || 'Scanner error'"
            :description="error.message"
            class="mt-2"
          />
        </div>
      </template>
    </UModal>
  </UFieldGroup>
</template>
