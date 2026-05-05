import type { PropType, VNode } from 'vue'
import { defineComponent, h } from 'vue'
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

/**
 * SVG overlay drawing polygons over each detected barcode. Sized to the
 * source's intrinsic dimensions via `viewBox`; absolutely positioned so it
 * can be stacked on top of a `<video>` / `<img>` parent.
 *
 * Use it directly inside a custom `overlay` slot of `<UseBarcodeDetector />`
 * to keep the default look while adding your own elements alongside it.
 *
 * @example Reuse the default overlay in a custom layout
 * ```vue
 * <UseBarcodeDetector>
 *   <template #overlay="{ detected, viewBox }">
 *     <BarcodeDetectorOverlay :detected="detected" :view-box="viewBox" />
 *     <span class="my-badge">{{ detected.length }} found</span>
 *   </template>
 * </UseBarcodeDetector>
 * ```
 *
 * @example Label each polygon with its scanned value
 * ```vue
 * <BarcodeDetectorOverlay
 *   :detected="detected"
 *   :rejected="rejected"
 *   :view-box="viewBox"
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
    /** SVG `viewBox` matching the source's intrinsic size. */
    viewBox: {
      type: String,
      required: true,
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
    return () => {
      if (!props.detected.length && !props.rejected.length) return null

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

      return h(
        'svg',
        {
          class: 'use-barcode-detector__overlay',
          viewBox: props.viewBox,
          preserveAspectRatio: 'none',
          'aria-hidden': 'true',
          style: {
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          },
        },
        children,
      )
    }
  },
})

export type BarcodeDetectorOverlayInstance = InstanceType<typeof BarcodeDetectorOverlay>
