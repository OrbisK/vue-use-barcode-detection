import type { PropType, VNode } from 'vue'
import { defineComponent, h } from 'vue'
import type { DetectedBarcode } from './index.js'

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
        [
          ...props.rejected.map((b, i) =>
            polygon(b, `r-${i}`, props.rejectedFill, props.rejectedStroke),
          ),
          ...props.detected.map((b, i) => polygon(b, `a-${i}`, props.fill, props.stroke)),
        ],
      )
    }
  },
})

export type BarcodeDetectorOverlayInstance = InstanceType<typeof BarcodeDetectorOverlay>
