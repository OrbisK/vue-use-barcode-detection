<script setup lang="ts">
import { useMounted, useSupported } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  BarcodeDetectorOverlay,
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
  /**
   * Map an accepted detection to the string written into `v-model`. Useful
   * when the QR encodes structured data (JSON, query strings, etc.) and you
   * only want to bind one field. Runs after `accept`. Return `null`/
   * `undefined` to skip writing to the model for this detection (no `scan`
   * event, no modal close — keep scanning). Defaults to `(b) => b.rawValue`.
   *
   * @example Pull a field out of a JSON-encoded payload
   * ```ts
   * transform: (b) => {
   *   try { return JSON.parse(b.rawValue).id }
   *   catch { return b.rawValue }
   * }
   * ```
   */
  transform?: (barcode: DetectedBarcode) => string | null | undefined
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
  const { class: _class, formats, once, accept, transform, scanLabel, scanIcon, ...rest } = props
  return rest
})

const open = ref(false)
const video = shallowRef<HTMLVideoElement | null>(null)

const isMounted = useMounted()
const apiSupported = useSupported(
  () => typeof window !== 'undefined' && 'BarcodeDetector' in window,
)
const isSupported = computed(() => isMounted.value && apiSupported.value)

const { detected, rejected, error, start, stop } = useBarcodeDetector(video, {
  // Pass formats as a getter so dynamic format changes flow through.
  formats: () => props.formats,
  // Stable closure that reads `props.accept` on each call — lets the parent
  // swap the predicate at runtime without re-mounting the wrapper.
  accept: (b) => (props.accept ? props.accept(b) : true),
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
  const next = props.transform ? props.transform(first) : first.rawValue
  // null/undefined from `transform` = "this scan didn't yield a usable value":
  // skip the model write, scan event, and modal close so the user can keep
  // scanning without dismissing the modal.
  if (next == null) return
  value.value = next
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
          <div class="relative overflow-hidden rounded-lg">
            <video ref="video" playsinline muted autoplay class="block w-full" />
            <BarcodeDetectorOverlay
              :detected="detected"
              :rejected="rejected"
              :view-box="`0 0 ${video?.videoWidth ?? 0} ${video?.videoHeight ?? 0}`"
            />
          </div>
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
