import type { PropType, VNode } from 'vue'
import { defineComponent, h, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { DetectedBarcode } from './index.js'

/**
 * Function returning the label to render over a detected barcode's polygon.
 * Receives the barcode and a flag telling accepted (true) from rejected
 * (false) detections. Return `null`, `undefined`, or an empty string to
 * skip the label for that specific barcode.
 *
 * @example Show the scanned value
 * ```ts
 * const label: BarcodeDetectorOverlayLabel = (b) => b.rawValue
 * ```
 *
 * @example Tell the user *why* a barcode was rejected
 * ```ts
 * const label: BarcodeDetectorOverlayLabel = (b, accepted) =>
 *   accepted ? b.rawValue : 'invalid'
 * ```
 */
export type BarcodeDetectorOverlayLabel = (
  barcode: DetectedBarcode,
  accepted: boolean,
) => string | null | undefined

interface VisibleRect {
  x: number
  y: number
  w: number
  h: number
  sw: number
  sh: number
}

function intrinsicSize(el: Element | null): { w: number; h: number } | null {
  if (!el) return null
  if (el instanceof HTMLVideoElement) {
    return el.videoWidth && el.videoHeight ? { w: el.videoWidth, h: el.videoHeight } : null
  }
  if (el instanceof HTMLImageElement) {
    return el.naturalWidth && el.naturalHeight ? { w: el.naturalWidth, h: el.naturalHeight } : null
  }
  if (el instanceof HTMLCanvasElement) {
    return el.width && el.height ? { w: el.width, h: el.height } : null
  }
  return null
}

// `getComputedStyle().objectPosition` returns normalized values, typically
// "<x>% <y>%" or "<x>px <y>px". Keywords (left/center/right/top/bottom) are
// normalized to percentages by the browser, but we still handle them in
// case a non-standard env (e.g. jsdom) leaves them unresolved.
function parsePositionAxis(value: string | undefined, range: number): number {
  if (!value) return range / 2
  if (value === 'left' || value === 'top') return 0
  if (value === 'right' || value === 'bottom') return range
  if (value === 'center') return range / 2
  if (value.endsWith('%')) return (parseFloat(value) / 100) * range
  if (value.endsWith('px')) return parseFloat(value)
  const num = parseFloat(value)
  return Number.isFinite(num) ? num : range / 2
}

function computeVisibleRect(source: HTMLElement, anchor: HTMLElement): VisibleRect | null {
  const intrinsic = intrinsicSize(source)
  if (!intrinsic) return null
  const elW = source.clientWidth
  const elH = source.clientHeight
  if (!elW || !elH) return null

  const styles = getComputedStyle(source)
  const fit = styles.objectFit || 'fill'
  let renderedW = elW
  let renderedH = elH
  if (fit === 'cover') {
    const scale = Math.max(elW / intrinsic.w, elH / intrinsic.h)
    renderedW = intrinsic.w * scale
    renderedH = intrinsic.h * scale
  } else if (fit === 'contain') {
    const scale = Math.min(elW / intrinsic.w, elH / intrinsic.h)
    renderedW = intrinsic.w * scale
    renderedH = intrinsic.h * scale
  } else if (fit === 'none') {
    renderedW = intrinsic.w
    renderedH = intrinsic.h
  } else if (fit === 'scale-down') {
    const scale = Math.min(1, elW / intrinsic.w, elH / intrinsic.h)
    renderedW = intrinsic.w * scale
    renderedH = intrinsic.h * scale
  }

  const positionParts = (styles.objectPosition || '50% 50%').split(/\s+/)
  const offsetX = parsePositionAxis(positionParts[0], elW - renderedW)
  const offsetY = parsePositionAxis(positionParts[1], elH - renderedH)

  // Position the SVG in the anchor's coordinate system. The anchor is the
  // SVG's offsetParent (the nearest positioned ancestor) — both elements
  // typically sit inside the same `position: relative` stage container.
  const sourceRect = source.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()

  return {
    x: sourceRect.left - anchorRect.left + offsetX,
    y: sourceRect.top - anchorRect.top + offsetY,
    w: renderedW,
    h: renderedH,
    sw: intrinsic.w,
    sh: intrinsic.h,
  }
}

/**
 * SVG overlay drawing polygons over each detected barcode. Pass the source
 * element (`<video>`, `<img>`, or `<canvas>`) via `source` and the overlay
 * tracks its rendered visible rect — mirroring `object-fit` and
 * `object-position` so polygons line up with the visible pixels even when
 * the container's aspect ratio differs from the source's.
 *
 * Place the overlay as a sibling of the source inside a positioned
 * container (`position: relative`). The SVG positions itself absolutely.
 *
 * @example Live camera with overlay
 * ```vue
 * <div class="stage">
 *   <video ref="video" playsinline muted autoplay />
 *   <BarcodeDetectorOverlay :detected="detected" :source="video" />
 * </div>
 * ```
 *
 * @example Image with accepted/rejected polygons + labels
 * ```vue
 * <BarcodeDetectorOverlay
 *   :detected="detected"
 *   :rejected="rejected"
 *   :source="img"
 *   :label="(b, accepted) => accepted ? b.rawValue : 'invalid'"
 * />
 * ```
 */
export const BarcodeDetectorOverlay = /* #__PURE__ */ defineComponent({
  name: 'BarcodeDetectorOverlay',
  props: {
    /** Accepted barcodes — drawn with the primary fill/stroke. */
    detected: {
      type: Array as PropType<DetectedBarcode[]>,
      required: true,
    },
    /**
     * Rejected barcodes — drawn with the secondary fill/stroke. Pair with
     * the `accept` predicate on `useBarcodeDetector` to highlight detections
     * that the predicate filtered out (e.g. wrong format, wrong prefix).
     */
    rejected: {
      type: Array as PropType<DetectedBarcode[]>,
      default: () => [],
    },
    /**
     * The `<video>` / `<img>` / `<canvas>` the overlay is drawn over. The
     * overlay reads its rendered visible rect (accounting for `object-fit`
     * and `object-position`) and sizes the SVG to exactly that rect — so
     * polygons land on the visible pixels regardless of how the source is
     * styled.
     */
    source: {
      type: Object as PropType<HTMLElement | null>,
      default: null,
    },
    /**
     * SVG `viewBox`. Auto-derived from `source`'s intrinsic size
     * (`videoWidth`/`videoHeight`, `naturalWidth`/`naturalHeight`, or
     * canvas width/height). Pass this prop to override.
     */
    viewBox: {
      type: String,
      default: undefined,
    },
    /** Fill for accepted polygons. */
    fill: {
      type: String,
      default: 'rgba(0, 200, 120, 0.15)',
    },
    /** Stroke for accepted polygons. */
    stroke: {
      type: String,
      default: 'rgb(0, 200, 120)',
    },
    /** Fill for rejected polygons. */
    rejectedFill: {
      type: String,
      default: 'rgba(220, 60, 60, 0.12)',
    },
    /** Stroke for rejected polygons. */
    rejectedStroke: {
      type: String,
      default: 'rgb(220, 60, 60)',
    },
    /** Polygon stroke width (in viewBox units, but rendered non-scaling). */
    strokeWidth: {
      type: Number,
      default: 4,
    },
    /**
     * Optional label rendered inside each polygon. Receives the barcode and
     * an `accepted` flag (true for `detected`, false for `rejected`). Return
     * a string to render, or a falsy value to suppress the label for that
     * specific detection. No labels are rendered when this prop is omitted.
     */
    label: {
      type: Function as PropType<BarcodeDetectorOverlayLabel>,
      default: undefined,
    },
    /** Label text fill. Defaults to white so text reads on either polygon color. */
    labelColor: {
      type: String,
      default: '#fff',
    },
    /**
     * Label font size, in viewBox units. The polygon stroke is reused as the
     * text outline (paint-order: stroke fill), so the label stays legible
     * over busy backgrounds without an extra background rectangle.
     */
    labelFontSize: {
      type: Number,
      default: 24,
    },
  },
  setup(props) {
    const rect = shallowRef<VisibleRect | null>(null)
    let resizeObserver: ResizeObserver | undefined
    let detachSourceListeners: (() => void) | null = null

    function update() {
      const source = props.source
      // The SVG is a sibling of the source inside a positioned container;
      // both share the same offsetParent. Reading from the source avoids a
      // chicken-and-egg: the SVG only mounts once polygons exist, but we
      // need the anchor to compute polygons.
      const anchor = (source?.offsetParent as HTMLElement | null) ?? source?.parentElement ?? null
      if (!source || !anchor) {
        rect.value = null
        return
      }
      rect.value = computeVisibleRect(source, anchor)
    }

    watch(
      () => props.source,
      (el, _prev, onCleanup) => {
        resizeObserver?.disconnect()
        resizeObserver = undefined
        detachSourceListeners?.()
        detachSourceListeners = null
        rect.value = null
        if (!el) return

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => update())
          resizeObserver.observe(el)
        }
        // Intrinsic dims become available asynchronously: `loadedmetadata`
        // for <video>, `load` for <img>. ResizeObserver alone doesn't fire
        // when only intrinsic dims change without a layout change.
        if (el instanceof HTMLVideoElement) {
          const onReady = () => update()
          el.addEventListener('loadedmetadata', onReady)
          el.addEventListener('resize', onReady)
          detachSourceListeners = () => {
            el.removeEventListener('loadedmetadata', onReady)
            el.removeEventListener('resize', onReady)
          }
        } else if (el instanceof HTMLImageElement) {
          const onLoad = () => update()
          el.addEventListener('load', onLoad)
          detachSourceListeners = () => el.removeEventListener('load', onLoad)
        }
        update()

        onCleanup(() => {
          resizeObserver?.disconnect()
          resizeObserver = undefined
          detachSourceListeners?.()
          detachSourceListeners = null
        })
      },
      { immediate: true, flush: 'post' },
    )

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      detachSourceListeners?.()
    })

    return () => {
      const r = rect.value
      const viewBoxAttr = props.viewBox ?? (r ? `0 0 ${r.sw} ${r.sh}` : null)
      if ((!props.detected.length && !props.rejected.length) || !viewBoxAttr) return null

      const polygon = (b: DetectedBarcode, key: string, fill: string, stroke: string): VNode =>
        h('polygon', {
          key,
          points: b.cornerPoints.map((c) => `${c.x},${c.y}`).join(' '),
          fill,
          stroke,
          'stroke-width': props.strokeWidth,
          'vector-effect': 'non-scaling-stroke',
        })

      const labelFn = props.label
      function renderLabel(
        b: DetectedBarcode,
        key: string,
        stroke: string,
        accepted: boolean,
      ): VNode | null {
        if (!labelFn) return null
        const raw = labelFn(b, accepted)
        if (!raw) return null
        if (!b.cornerPoints.length) return null
        // Anchor inside the polygon near its top-left so labels stay visible
        // even when a barcode sits at the edge of the source. Computed from
        // cornerPoints rather than boundingBox because some BarcodeDetector
        // implementations leave boundingBox sparsely populated.
        const xs = b.cornerPoints.map((p) => p.x)
        const ys = b.cornerPoints.map((p) => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const pad = props.labelFontSize * 0.3
        const x = minX + pad
        const y = minY + props.labelFontSize

        // Truncate to the polygon's width using a proportional-font
        // heuristic — exact text measurement isn't possible on the server
        // and would require a hidden DOM node on the client. The 0.55
        // multiplier is roughly the average glyph advance / font-size
        // ratio for system-ui, slightly conservative so we under-fill
        // rather than overflow. If even a single ellipsis won't fit, drop
        // the label entirely instead of rendering a sliver of garbage.
        const polygonWidth = maxX - minX
        const available = polygonWidth - pad * 2
        const charWidth = props.labelFontSize * 0.55
        const maxChars = Math.floor(available / charWidth)
        if (maxChars < 1) return null
        const text =
          raw.length > maxChars ? (maxChars > 1 ? raw.slice(0, maxChars - 1) + '…' : '…') : raw
        return h(
          'text',
          {
            key,
            x,
            y,
            'font-size': props.labelFontSize,
            'font-family': 'system-ui, sans-serif',
            'font-weight': 600,
            fill: props.labelColor,
            stroke,
            'stroke-width': props.strokeWidth,
            'paint-order': 'stroke fill',
            'stroke-linejoin': 'round',
            'dominant-baseline': 'alphabetic',
            'text-anchor': 'start',
          },
          text,
        )
      }

      const children: VNode[] = []
      props.rejected.forEach((b, i) => {
        children.push(polygon(b, `r-${i}`, props.rejectedFill, props.rejectedStroke))
        const lbl = renderLabel(b, `r-l-${i}`, props.rejectedStroke, false)
        if (lbl) children.push(lbl)
      })
      props.detected.forEach((b, i) => {
        children.push(polygon(b, `a-${i}`, props.fill, props.stroke))
        const lbl = renderLabel(b, `a-l-${i}`, props.stroke, true)
        if (lbl) children.push(lbl)
      })

      // Without a measured rect (no source / pre-mount / SSR) fall back to
      // filling the offset parent so the SVG still draws something useful
      // — preserveAspectRatio mirrors the typical `object-fit: cover`.
      const positioned = r
        ? {
            position: 'absolute' as const,
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: `${r.w}px`,
            height: `${r.h}px`,
            pointerEvents: 'none' as const,
          }
        : {
            position: 'absolute' as const,
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none' as const,
          }

      return h(
        'svg',
        {
          class: 'use-barcode-detector__overlay',
          viewBox: viewBoxAttr,
          preserveAspectRatio: 'none',
          'aria-hidden': 'true',
          style: positioned,
        },
        children,
      )
    }
  },
})

export type BarcodeDetectorOverlayInstance = InstanceType<typeof BarcodeDetectorOverlay>
