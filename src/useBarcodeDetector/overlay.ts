import type { PropType } from 'vue'
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
    /** Detected barcodes whose `cornerPoints` are drawn as polygons. */
    detected: {
      type: Array as PropType<DetectedBarcode[]>,
      required: true,
    },
    /** SVG `viewBox` matching the source's intrinsic size. */
    viewBox: {
      type: String,
      required: true,
    },
    /** Polygon fill. */
    fill: {
      type: String,
      default: 'rgba(0, 200, 120, 0.15)',
    },
    /** Polygon stroke. */
    stroke: {
      type: String,
      default: 'rgb(0, 200, 120)',
    },
    /** Polygon stroke width (in viewBox units, but rendered non-scaling). */
    strokeWidth: {
      type: Number,
      default: 4,
    },
  },
  setup(props) {
    return () => {
      if (!props.detected.length) return null
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
        props.detected.map((b, i) =>
          h('polygon', {
            key: i,
            points: b.cornerPoints.map((c) => `${c.x},${c.y}`).join(' '),
            fill: props.fill,
            stroke: props.stroke,
            'stroke-width': props.strokeWidth,
            'vector-effect': 'non-scaling-stroke',
          }),
        ),
      )
    }
  },
})

export type BarcodeDetectorOverlayInstance = InstanceType<typeof BarcodeDetectorOverlay>
