import { useMounted } from '@vueuse/core'
import type { PropType, SlotsType, VNode, VNodeRef } from 'vue'
import { defineComponent, h, shallowRef } from 'vue'
import type {
  BarcodeFormat,
  BarcodeImageSource,
  DetectedBarcode,
  UseBarcodeDetectorOptions,
  UseBarcodeDetectorReturn,
} from './index.js'
import { useBarcodeDetector } from './index.js'
import { BarcodeDetectorOverlay } from './overlay.js'

export interface UseBarcodeDetectorSlotProps {
  isSupported: boolean
  supportedFormats: BarcodeFormat[]
  detected: DetectedBarcode[]
  /** Detections the `accept` predicate filtered out. Always empty when `accept` is unset. */
  rejected: DetectedBarcode[]
  error: Error | null
  isActive: boolean
  detect: UseBarcodeDetectorReturn['detect']
  start: UseBarcodeDetectorReturn['start']
  stop: UseBarcodeDetectorReturn['stop']
  /** Current source element (or whatever the user bound via `setSource`). */
  source: HTMLElement | null
  /** Bind to your own `<video>` / `<img>` / `<canvas>` via `:ref="setSource"` when going fully headless. */
  setSource: (el: Element | null) => void
}

export interface UseBarcodeDetectorOverlaySlotProps {
  detected: DetectedBarcode[]
  /** Detections the `accept` predicate filtered out. Always empty when `accept` is unset. */
  rejected: DetectedBarcode[]
  source: HTMLElement | null
}

type SlotProps = UseBarcodeDetectorSlotProps
type OverlayProps = UseBarcodeDetectorOverlaySlotProps

/**
 * All-in-one wrapper component around {@link useBarcodeDetector}.
 *
 * By default, renders a `<video>` element with an SVG overlay drawing the
 * polygons of detected barcodes — drop it in and you have a working scanner.
 *
 * - **`overlay` slot** — replace only the default overlay. Receives
 *   `{ detected, rejected, source }`. The source element is reactive — pass it
 *   to `<BarcodeDetectorOverlay :source="source">` to keep auto-alignment.
 * - **default slot** — rendered as a sibling _after_ the stage, with full
 *   composable state + actions as slot props. Use this for results lists,
 *   buttons, error messages, etc.
 * - **`headless` prop** — skip the built-in stage entirely. The default slot
 *   becomes the sole rendering and must wire up its own source element via
 *   `setSource`.
 *
 * @example Drop-in scanner
 * ```vue
 * <UseBarcodeDetector />
 * ```
 *
 * @example Custom UI alongside the scanner
 * ```vue
 * <UseBarcodeDetector v-slot="{ detected, error }">
 *   <p v-if="error">{{ error.message }}</p>
 *   <ul>
 *     <li v-for="b in detected" :key="b.rawValue">{{ b.rawValue }}</li>
 *   </ul>
 * </UseBarcodeDetector>
 * ```
 *
 * @example Custom overlay only
 * ```vue
 * <UseBarcodeDetector>
 *   <template #overlay="{ detected, source }">
 *     <BarcodeDetectorOverlay :detected="detected" :source="source" :label="...">
 *   </template>
 * </UseBarcodeDetector>
 * ```
 *
 * @example Fully headless
 * ```vue
 * <UseBarcodeDetector headless v-slot="{ setSource, detected }">
 *   <video :ref="setSource" playsinline muted autoplay />
 *   <pre>{{ detected }}</pre>
 * </UseBarcodeDetector>
 * ```
 */
export const UseBarcodeDetector = /* #__PURE__ */ defineComponent({
  name: 'UseBarcodeDetector',
  props: {
    formats: {
      type: Array as PropType<BarcodeFormat[]>,
      default: undefined,
    },
    /**
     * Auto-start the camera + detection loop on mount. Defaults to `false` so
     * the component works on Safari/iOS, where `getUserMedia` and
     * `video.play()` must be invoked from a user gesture. Wire `start()` from
     * the default slot to a button instead.
     */
    immediate: {
      type: Boolean,
      default: false,
    },
    camera: {
      type: [Boolean, Object] as PropType<boolean | MediaTrackConstraints>,
      default: true,
    },
    /** Skip the built-in stage; the default slot is the only rendering. */
    headless: {
      type: Boolean,
      default: false,
    },
    /**
     * Stop after the first accepted detection. Pair with `accept` to stop
     * only on matching barcodes.
     */
    once: {
      type: Boolean,
      default: false,
    },
    /**
     * Predicate gating which detections count. Non-matching barcodes are
     * filtered out of `detected`. Useful e.g. to filter by format or
     * `rawValue` prefix.
     */
    accept: {
      type: Function as PropType<UseBarcodeDetectorOptions['accept']>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<{
    default: SlotProps
    overlay: OverlayProps
  }>,
  setup(props, { slots, expose }) {
    const source = shallowRef<HTMLElement | null>(null)
    const setSource = (el: Element | null) => {
      source.value = (el as HTMLElement | null) ?? null
    }
    const sourceRef: VNodeRef = (el) => setSource(el as Element | null)

    // Pass the reactive options as getters so the composable picks up
    // prop changes at runtime (formats rebuilds the detector; once flips
    // stop-on-first behavior live). `accept` stays a stable function
    // reference but reads `props.accept` on each call, so swapping the
    // predicate from the parent flows through too.
    const result = useBarcodeDetector(() => source.value as BarcodeImageSource | null, {
      formats: () => props.formats,
      immediate: props.immediate,
      camera: props.camera,
      once: () => props.once,
      accept: (b) => (props.accept ? props.accept(b) : true),
    })

    expose(result)

    // Gate browser-API-derived state on `useMounted` so SSR and the client's
    // first render emit the same value, then flip after hydration.
    const isMounted = useMounted()

    const slotProps = (): SlotProps => ({
      isSupported: isMounted.value && result.isSupported.value,
      supportedFormats: result.supportedFormats.value,
      detected: result.detected.value,
      rejected: result.rejected.value,
      error: result.error.value,
      isActive: result.isActive.value,
      detect: result.detect,
      start: result.start,
      stop: result.stop,
      source: source.value,
      setSource,
    })

    const overlayProps = (): OverlayProps => ({
      detected: result.detected.value,
      rejected: result.rejected.value,
      source: source.value,
    })

    function renderStage(): VNode {
      const op = overlayProps()
      const overlay = slots.overlay
        ? slots.overlay(op)
        : h(BarcodeDetectorOverlay, {
            detected: op.detected,
            rejected: op.rejected,
            source: op.source,
          })
      return h(
        'div',
        {
          class: 'use-barcode-detector',
          style: { position: 'relative' },
        },
        [
          h('video', {
            ref: sourceRef,
            playsinline: '',
            muted: true,
            autoplay: true,
            style: { width: '100%', height: '100%', display: 'block', objectFit: 'cover' },
          }),
          overlay,
        ],
      )
    }

    return () => {
      const slotted = slots.default?.(slotProps())
      if (props.headless) return slotted
      return slotted ? [renderStage(), slotted] : renderStage()
    }
  },
})

export type UseBarcodeDetectorInstance = InstanceType<typeof UseBarcodeDetector>
