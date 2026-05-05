import { useMounted } from '@vueuse/core'
import type { PropType, SlotsType, VNode, VNodeRef } from 'vue'
import { defineComponent, h, shallowRef } from 'vue'
import type {
  BarcodeFormat,
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
  error: Error | null
  isActive: boolean
  detect: UseBarcodeDetectorReturn['detect']
  start: UseBarcodeDetectorReturn['start']
  stop: UseBarcodeDetectorReturn['stop']
  /** Current `<video>` element (or whatever the user bound via `setVideo`). */
  video: HTMLVideoElement | null
  /** Bind to your own `<video>` via `:ref="setVideo"` when going fully headless. */
  setVideo: (el: Element | null) => void
}

export interface UseBarcodeDetectorOverlaySlotProps {
  detected: DetectedBarcode[]
  video: HTMLVideoElement | null
  /** Pre-computed `viewBox` string matching the video's intrinsic size. */
  viewBox: string
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
 *   `{ detected, video, viewBox }`.
 * - **default slot** — rendered as a sibling _after_ the stage, with full
 *   composable state + actions as slot props. Use this for results lists,
 *   buttons, error messages, etc.
 * - **`headless` prop** — skip the built-in stage entirely. The default slot
 *   becomes the sole rendering and must wire up its own `<video>` via
 *   `setVideo`.
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
 *   <template #overlay="{ detected, viewBox }">
 *     <svg :viewBox="viewBox"> ... </svg>
 *   </template>
 * </UseBarcodeDetector>
 * ```
 *
 * @example Fully headless
 * ```vue
 * <UseBarcodeDetector headless v-slot="{ setVideo, detected }">
 *   <video :ref="setVideo" playsinline muted autoplay />
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
    const video = shallowRef<HTMLVideoElement | null>(null)
    const setVideo = (el: Element | null) => {
      video.value = (el as HTMLVideoElement | null) ?? null
    }
    const videoRef: VNodeRef = (el) => setVideo(el as Element | null)

    const result = useBarcodeDetector(video, {
      formats: props.formats,
      immediate: props.immediate,
      camera: props.camera,
      once: props.once,
      accept: props.accept,
    })

    expose(result)

    // Gate browser-API-derived state on `useMounted` so SSR and the client's
    // first render emit the same value, then flip after hydration.
    const isMounted = useMounted()

    const slotProps = (): SlotProps => ({
      isSupported: isMounted.value && result.isSupported.value,
      supportedFormats: result.supportedFormats.value,
      detected: result.detected.value,
      error: result.error.value,
      isActive: result.isActive.value,
      detect: result.detect,
      start: result.start,
      stop: result.stop,
      video: video.value,
      setVideo,
    })

    const overlayProps = (): OverlayProps => {
      const v = video.value
      const w = v?.videoWidth ?? 0
      const hgt = v?.videoHeight ?? 0
      return {
        detected: result.detected.value,
        video: v,
        viewBox: `0 0 ${w} ${hgt}`,
      }
    }

    function renderStage(): VNode {
      const op = overlayProps()
      const overlay = slots.overlay
        ? slots.overlay(op)
        : h(BarcodeDetectorOverlay, { detected: op.detected, viewBox: op.viewBox })
      return h(
        'div',
        {
          class: 'use-barcode-detector',
          style: { position: 'relative' },
        },
        [
          h('video', {
            ref: videoRef,
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
