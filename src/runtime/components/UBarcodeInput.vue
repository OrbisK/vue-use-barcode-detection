<script setup lang="ts">
import { useMounted, useSupported } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  type BarcodeFormat,
  type DetectedBarcode,
  type UseBarcodeDetectorOptions,
  useBarcodeDetector,
} from '@orbisk/vue-use-barcode-detection'
import type { InputProps } from '@nuxt/ui/components/Input.vue'

defineOptions({ inheritAttrs: false })

interface Props
  extends /* @vue-ignore */ Omit<InputProps, 'modelValue' | 'defaultValue' | 'modelModifiers'> {
  formats?: BarcodeFormat[]
  /**
   * Stop scanning after the first detection. Defaults to `true` so the modal
   * closes immediately on a hit. Pass a predicate to filter (e.g. by format).
   */
  once?: UseBarcodeDetectorOptions['once']
  /** Accessible label + modal title for the scan button. */
  scanLabel?: string
  /** Icon for the scan button. Pass any name your Nuxt UI iconset exposes. */
  scanIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  once: true,
  scanLabel: 'Scan barcode',
  scanIcon: 'i-lucide-scan-line',
})

const value = defineModel<string>({ default: '' })

const emit = defineEmits<{
  scan: [DetectedBarcode]
  blur: [FocusEvent]
  change: [Event]
}>()

const inputProps = computed(() => {
  const { class: _class, formats, once, scanLabel, scanIcon, ...rest } = props
  return rest
})

const open = ref(false)
const video = shallowRef<HTMLVideoElement | null>(null)

const isMounted = useMounted()
const apiSupported = useSupported(
  () => typeof window !== 'undefined' && 'BarcodeDetector' in window,
)
const isSupported = computed(() => isMounted.value && apiSupported.value)

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
  <UFieldGroup :class="['w-full', props.class]">
    <UInput
      v-bind="{ ...$attrs, ...inputProps }"
      v-model="value"
      class="flex-1"
      @blur="emit('blur', $event)"
      @change="emit('change', $event)"
    />
    <UModal v-if="isSupported" v-model:open="open" :title="scanLabel" @after:leave="stop">
      <UButton
        :icon="scanIcon"
        :size="size"
        :color="color"
        :disabled="disabled"
        variant="subtle"
        square
        :aria-label="scanLabel"
      />
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
