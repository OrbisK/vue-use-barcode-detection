<script setup lang="ts">
import { useMounted, useSupported } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  type BarcodeFormat,
  type DetectedBarcode,
  useBarcodeDetector,
} from '@orbisk/vue-use-barcode-detection'
import type { InputProps } from '@nuxt/ui/components/Input.vue'

defineOptions({ inheritAttrs: false })

interface Props
  extends /* @vue-ignore */ Omit<InputProps, 'modelValue' | 'defaultValue' | 'modelModifiers'> {
  formats?: BarcodeFormat[]
  /**
   * Close the modal after the first accepted detection. Defaults to `true`.
   * Set to `false` to keep scanning — every accepted barcode updates the
   * model value and emits `scan`, but the modal stays open until dismissed.
   */
  once?: boolean
  /**
   * Predicate gating which detections count. Useful e.g. to filter by
   * format or `rawValue` prefix: `:accept="(b) => b.rawValue.startsWith('XX-')"`.
   * Detections that don't match are ignored — no model update, no `scan`
   * event, no modal close.
   */
  accept?: (barcode: DetectedBarcode) => boolean
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
  const { class: _class, formats, once, accept, scanLabel, scanIcon, ...rest } = props
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
  accept: props.accept,
  // Modal-close decision lives on the wrapper; the composable just streams
  // accepted detections.
  once: false,
})

watch(video, (el) => {
  if (el && open.value) void start()
})

watch(detected, (list) => {
  if (!list.length) return
  const first = list[0]!
  value.value = first.rawValue
  emit('scan', first)
  if (props.once) open.value = false
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
