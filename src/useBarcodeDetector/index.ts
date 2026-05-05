import type { ConfigurableWindow, UseSupportedReturn } from '@vueuse/core'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { defaultWindow, tryOnScopeDispose, useRafFn, useSupported } from '@vueuse/core'
import { isRef, onMounted, shallowRef, toValue, watch, shallowReadonly } from 'vue'

export type BarcodeFormat =
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e'
  | 'unknown'

/**
 * Anything `BarcodeDetector#detect` accepts.
 * @see https://developer.mozilla.org/docs/Web/API/BarcodeDetector/detect
 */
export type BarcodeImageSource =
  | HTMLImageElement
  | SVGImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | ImageBitmap
  | OffscreenCanvas
  | VideoFrame
  | Blob
  | ImageData

export interface DetectedBarcode {
  rawValue: string
  format: BarcodeFormat
  boundingBox: DOMRectReadOnly
  cornerPoints: { x: number; y: number }[]
}

interface BarcodeDetectorLike {
  detect: (source: BarcodeImageSource) => Promise<DetectedBarcode[]>
}

interface BarcodeDetectorCtor {
  new (init?: { formats?: BarcodeFormat[] }): BarcodeDetectorLike
  getSupportedFormats: () => Promise<BarcodeFormat[]>
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor
  }
}

export interface UseBarcodeDetectorOptions extends ConfigurableWindow {
  /**
   * Formats to detect. Defaults to every format supported by the browser.
   * Reactive: pass a ref or a getter to switch formats at runtime; the
   * underlying `BarcodeDetector` is rebuilt when the value changes.
   */
  formats?: MaybeRefOrGetter<BarcodeFormat[] | undefined>
  /**
   * Auto-start once the source is available.
   * For a video source, starts the camera stream and detection loop.
   * For other sources, runs `detect()` whenever the source changes.
   *
   * Defaults to `false` — calling `getUserMedia` and `video.play()` outside
   * of a user gesture is rejected by Safari/iOS, so live-camera scanning has
   * to be wired to a click handler. Set to `true` only if you're sure the
   * source is available inside a user gesture (or it's not a video).
   */
  immediate?: boolean
  /**
   * Camera handling when the source is an `HTMLVideoElement`.
   * - `true` (default): call `getUserMedia` with `{ facingMode: 'environment' }`.
   * - `MediaTrackConstraints`: call `getUserMedia` with the given video constraints.
   * - `false`: do not touch the video element's stream — use your own.
   */
  camera?: boolean | MediaTrackConstraints
  /**
   * Stop after the first accepted detection.
   * - `false` (default): keep scanning.
   * - `true`: as soon as a barcode is detected (and accepted, if `accept` is
   *   set), stop the detection loop and release the camera (video sources).
   *   The detection result remains in `detected`. Call `start()` to re-arm.
   *
   * Reactive: pass a ref or getter to flip the behavior at runtime. The
   * value is read at each detection, so flipping it after the loop has
   * already stopped won't auto-restart it — call `start()` for that.
   */
  once?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Predicate gating which detections count. Non-matching barcodes are
   * filtered out of `detected` (and the `detect()` return value), so they
   * don't trigger watchers or `once`. Useful e.g. to filter by format or
   * `rawValue` prefix: `accept: (b) => b.rawValue.startsWith('XX-')`.
   *
   * Not made `MaybeRefOrGetter` on purpose: `toValue` can't disambiguate a
   * predicate from a getter that returns a predicate. The closure captures
   * any reactive deps you reference, so a single closure already gives you
   * runtime-reactive behavior — e.g.
   * `accept: (b) => !prefix.value || b.rawValue.startsWith(prefix.value)`.
   */
  accept?: (barcode: DetectedBarcode) => boolean
}

export interface UseBarcodeDetectorReturn {
  isSupported: UseSupportedReturn
  supportedFormats: Readonly<ShallowRef<BarcodeFormat[]>>
  /** Barcodes that passed the `accept` predicate (or all detections, if no `accept` is set). */
  detected: Readonly<ShallowRef<DetectedBarcode[]>>
  /** Barcodes the `accept` predicate filtered out. Always empty when `accept` is unset. */
  rejected: Readonly<ShallowRef<DetectedBarcode[]>>
  error: Readonly<ShallowRef<Error | null>>
  /** True while the camera stream + detection loop are running (video sources only). */
  isActive: Readonly<ShallowRef<boolean>>
  /** Run detection once against the given source, or the configured source ref. */
  detect: (source?: BarcodeImageSource | null) => Promise<DetectedBarcode[]>
  /** Start the camera stream + detection loop. No-op for non-video sources. */
  start: () => Promise<void>
  /** Stop the camera stream + detection loop. */
  stop: () => void
}

const DEFAULT_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
}

function isVideoElement(value: unknown): value is HTMLVideoElement {
  return typeof HTMLVideoElement !== 'undefined' && value instanceof HTMLVideoElement
}

function isImageElement(value: unknown): value is HTMLImageElement {
  return typeof HTMLImageElement !== 'undefined' && value instanceof HTMLImageElement
}

function whenImageReady(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve) => {
    const cleanup = () => {
      img.removeEventListener('load', done)
      img.removeEventListener('error', done)
    }
    const done = () => {
      cleanup()
      resolve()
    }
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })
}

/**
 * Reactive wrapper around the [Barcode Detection API](https://developer.mozilla.org/docs/Web/API/Barcode_Detection_API).
 *
 * Accepts any source `BarcodeDetector#detect` understands: `HTMLImageElement`,
 * `SVGImageElement`, `HTMLVideoElement`, `HTMLCanvasElement`, `ImageBitmap`,
 * `OffscreenCanvas`, `VideoFrame`, `Blob`, `ImageData`.
 *
 * For an `HTMLVideoElement` source, manages a `getUserMedia` stream and runs
 * detection on each animation frame. For any other source, runs detection
 * whenever the source ref changes.
 *
 * @example Live camera
 * ```ts
 * const video = useTemplateRef<HTMLVideoElement>('video')
 * const { detected, isSupported, error } = useBarcodeDetector(video)
 * ```
 *
 * @example Static image
 * ```ts
 * const img = useTemplateRef<HTMLImageElement>('img')
 * const { detected } = useBarcodeDetector(img)
 * ```
 *
 * @example Manual detection on a Blob
 * ```ts
 * const { detect } = useBarcodeDetector()
 * const result = await detect(myBlob)
 * ```
 */
export function useBarcodeDetector(
  source?: MaybeRefOrGetter<BarcodeImageSource | null | undefined>,
  options: UseBarcodeDetectorOptions = {},
): UseBarcodeDetectorReturn {
  const {
    formats,
    immediate = false,
    camera = true,
    once = false,
    accept,
    window = defaultWindow,
  } = options

  const isSupported = useSupported(() => !!window && 'BarcodeDetector' in window)
  const supportedFormats = shallowRef<BarcodeFormat[]>([])
  const detected = shallowRef<DetectedBarcode[]>([])
  const rejected = shallowRef<DetectedBarcode[]>([])
  const error = shallowRef<Error | null>(null)
  const isActive = shallowRef(false)

  let stream: MediaStream | null = null
  let detector: BarcodeDetectorLike | null = null
  let detectorInit: Promise<BarcodeDetectorLike | null> | null = null

  function partition(barcodes: DetectedBarcode[]): {
    accepted: DetectedBarcode[]
    rejected: DetectedBarcode[]
  } {
    if (!accept) return { accepted: barcodes, rejected: [] }
    const a: DetectedBarcode[] = []
    const r: DetectedBarcode[] = []
    for (const b of barcodes) (accept(b) ? a : r).push(b)
    return { accepted: a, rejected: r }
  }

  async function ensureDetector(): Promise<BarcodeDetectorLike | null> {
    if (detector) return detector
    if (!isSupported.value || !window) {
      error.value = new Error('`BarcodeDetector` is not available in this browser.')
      return null
    }
    detectorInit ??= (async () => {
      const Ctor = window.BarcodeDetector!
      const available = await Ctor.getSupportedFormats()
      supportedFormats.value = available
      detector = new Ctor({ formats: toValue(formats) ?? available })
      return detector
    })()
    return detectorInit
  }

  // Rebuild the detector when `formats` changes. Only watch when the option
  // is actually a ref or getter — a plain array can never change, so there's
  // no point spinning up a watcher. The active loop keeps running: it just
  // returns early on frames where `detector` is null, then resumes against
  // the new instance once `ensureDetector` resolves.
  if (isRef(formats) || typeof formats === 'function') {
    watch(
      () => toValue(formats),
      () => {
        detector = null
        detectorInit = null
        void ensureDetector()
      },
    )
  }

  async function detect(src?: BarcodeImageSource | null): Promise<DetectedBarcode[]> {
    const input = src ?? toValue(source) ?? null
    if (!input) return []
    const d = await ensureDetector()
    if (!d) return []
    try {
      if (isImageElement(input)) await whenImageReady(input)
      const { accepted, rejected: r } = partition(await d.detect(input))
      detected.value = accepted
      rejected.value = r
      error.value = null
      if (toValue(once) && accepted.length && isVideoElement(input)) stop()
      return accepted
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      return []
    }
  }

  const loop = useRafFn(
    async () => {
      const el = toValue(source)
      if (!detector || !el) return
      try {
        const { accepted, rejected: r } = partition(await detector.detect(el))
        detected.value = accepted
        rejected.value = r
        if (toValue(once) && accepted.length) stop()
      } catch {
        // detect() can throw transiently while the video isn't ready -> ignore
      }
    },
    { immediate: false },
  )

  async function start(): Promise<void> {
    if (isActive.value) return
    const el = toValue(source)
    if (!isVideoElement(el)) return
    const d = await ensureDetector()
    if (!d) return

    try {
      if (camera !== false) {
        const constraints = camera === true ? DEFAULT_CONSTRAINTS : camera
        stream = await window!.navigator.mediaDevices.getUserMedia({
          video: constraints,
          audio: false,
        })
        el.srcObject = stream
        await el.play()
      }

      isActive.value = true
      error.value = null
      loop.resume()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      stop()
    }
  }

  function stop(): void {
    loop.pause()
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    const el = toValue(source)
    if (camera !== false && isVideoElement(el)) el.srcObject = null
    isActive.value = false
  }

  if (immediate && source !== undefined) {
    onMounted(() => {
      const init = () => {
        const current = toValue(source)
        if (!current) return false
        if (isVideoElement(current)) void start()
        else void detect(current)
        return true
      }
      if (init()) return
      const stopWatch = watch(
        () => toValue(source),
        () => {
          if (init()) stopWatch()
        },
      )
    })

    watch(
      () => toValue(source),
      (next) => {
        if (next && !isVideoElement(next)) void detect(next)
      },
    )
  }

  tryOnScopeDispose(stop)

  return {
    isSupported,
    supportedFormats: shallowReadonly(supportedFormats),
    detected: shallowReadonly(detected),
    rejected: shallowReadonly(rejected),
    error: shallowReadonly(error),
    isActive: shallowReadonly(isActive),
    detect,
    start,
    stop,
  }
}
