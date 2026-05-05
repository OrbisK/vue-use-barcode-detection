import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { describe, expect, it } from 'vitest'
import type { DetectedBarcode } from './index.js'
import { BarcodeDetectorOverlay } from './overlay.js'

const fakeBarcode = (
  rawValue: string,
  cornerPoints: { x: number; y: number }[],
): DetectedBarcode => ({
  rawValue,
  format: 'qr_code',
  boundingBox: {} as DOMRectReadOnly,
  cornerPoints,
})

function render(props: Record<string, unknown>) {
  return renderToString(createSSRApp({ render: () => h(BarcodeDetectorOverlay as never, props) }))
}

describe('BarcodeDetectorOverlay', () => {
  it('renders nothing when there are no detections', async () => {
    const html = await render({ detected: [], viewBox: '0 0 100 100' })
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('<polygon')
  })

  it('renders one polygon per detected barcode with the given viewBox', async () => {
    const html = await render({
      detected: [
        fakeBarcode('a', [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ]),
        fakeBarcode('b', [
          { x: 20, y: 20 },
          { x: 30, y: 20 },
          { x: 30, y: 30 },
          { x: 20, y: 30 },
        ]),
      ],
      viewBox: '0 0 640 480',
    })
    expect(html).toContain('<svg')
    expect(html).toContain('viewBox="0 0 640 480"')
    expect(html).toContain('points="0,0 10,0 10,10 0,10"')
    expect(html).toContain('points="20,20 30,20 30,30 20,30"')
    expect(html.match(/<polygon/g) ?? []).toHaveLength(2)
  })

  it('honors fill, stroke, and strokeWidth overrides', async () => {
    const html = await render({
      detected: [fakeBarcode('a', [{ x: 0, y: 0 }])],
      viewBox: '0 0 1 1',
      fill: 'red',
      stroke: 'blue',
      strokeWidth: 8,
    })
    expect(html).toContain('fill="red"')
    expect(html).toContain('stroke="blue"')
    expect(html).toContain('stroke-width="8"')
  })
})
