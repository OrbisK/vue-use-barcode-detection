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

  it('renders rejected barcodes with separate fill/stroke', async () => {
    const html = await render({
      detected: [
        fakeBarcode('a', [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ]),
      ],
      rejected: [
        fakeBarcode('r', [
          { x: 5, y: 5 },
          { x: 6, y: 5 },
          { x: 6, y: 6 },
          { x: 5, y: 6 },
        ]),
      ],
      viewBox: '0 0 10 10',
      fill: '#0f0',
      stroke: '#0a0',
      rejectedFill: '#f00',
      rejectedStroke: '#a00',
    })
    expect(html.match(/<polygon/g) ?? []).toHaveLength(2)
    expect(html).toContain('fill="#0f0"')
    expect(html).toContain('stroke="#0a0"')
    expect(html).toContain('fill="#f00"')
    expect(html).toContain('stroke="#a00"')
    expect(html).toContain('points="0,0 1,0 1,1 0,1"')
    expect(html).toContain('points="5,5 6,5 6,6 5,6"')
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

  it('renders no <text> when `label` is omitted', async () => {
    const html = await render({
      detected: [
        fakeBarcode('hello', [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ]),
      ],
      viewBox: '0 0 100 100',
    })
    expect(html).not.toContain('<text')
  })

  it('renders the label returned by the function for each barcode', async () => {
    const html = await render({
      detected: [
        // ≥80 units wide so a 5-char label fits at fontSize 20.
        fakeBarcode('hello', [
          { x: 10, y: 20 },
          { x: 110, y: 20 },
          { x: 110, y: 40 },
          { x: 10, y: 40 },
        ]),
      ],
      rejected: [
        fakeBarcode('invalid', [
          { x: 50, y: 60 },
          { x: 200, y: 60 },
          { x: 200, y: 80 },
          { x: 50, y: 80 },
        ]),
      ],
      viewBox: '0 0 200 200',
      label: (b: DetectedBarcode, accepted: boolean) => (accepted ? b.rawValue : 'invalid'),
      labelFontSize: 20,
    })
    expect(html.match(/<text/g) ?? []).toHaveLength(2)
    expect(html).toContain('>hello</text>')
    expect(html).toContain('>invalid</text>')
    // Anchored at top-left of cornerPoints (minX + pad, minY + fontSize).
    expect(html).toContain('x="16"')
    expect(html).toContain('y="40"')
    expect(html).toContain('x="56"')
    expect(html).toContain('y="80"')
  })

  it('skips labels for which the function returns falsy', async () => {
    const html = await render({
      detected: [
        fakeBarcode('keep', [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 50 },
          { x: 0, y: 50 },
        ]),
        fakeBarcode('drop', [
          { x: 0, y: 60 },
          { x: 200, y: 60 },
          { x: 200, y: 100 },
          { x: 0, y: 100 },
        ]),
      ],
      viewBox: '0 0 200 200',
      label: (b: DetectedBarcode) => (b.rawValue === 'drop' ? null : b.rawValue),
    })
    expect(html.match(/<text/g) ?? []).toHaveLength(1)
    expect(html).toContain('>keep</text>')
    expect(html).not.toContain('>drop</text>')
  })

  it('truncates labels that would overflow the polygon width', async () => {
    // Polygon is 80 units wide. fontSize 20 → charWidth ≈ 11 → ~6 chars
    // max once padding is subtracted.
    const html = await render({
      detected: [
        fakeBarcode('this-is-a-very-long-value', [
          { x: 10, y: 10 },
          { x: 90, y: 10 },
          { x: 90, y: 30 },
          { x: 10, y: 30 },
        ]),
      ],
      viewBox: '0 0 100 100',
      label: (b: DetectedBarcode) => b.rawValue,
      labelFontSize: 20,
    })
    expect(html).toMatch(/<text[^>]*>[^<]*…<\/text>/)
    // The full string must not appear verbatim — it would overflow.
    expect(html).not.toContain('>this-is-a-very-long-value</text>')
  })

  it('keeps short labels untouched', async () => {
    const html = await render({
      detected: [
        fakeBarcode('ok', [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 50 },
          { x: 0, y: 50 },
        ]),
      ],
      viewBox: '0 0 200 200',
      label: (b: DetectedBarcode) => b.rawValue,
      labelFontSize: 20,
    })
    expect(html).toContain('>ok</text>')
    expect(html).not.toContain('…')
  })

  it('skips labels entirely when the polygon is too narrow for any text', async () => {
    const html = await render({
      detected: [
        fakeBarcode('hidden', [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 4 },
          { x: 0, y: 4 },
        ]),
      ],
      viewBox: '0 0 100 100',
      label: () => 'hidden',
      labelFontSize: 24,
    })
    expect(html).not.toContain('<text')
  })

  it('uses the polygon stroke as the label outline so text reads on busy backgrounds', async () => {
    const html = await render({
      detected: [
        fakeBarcode('a', [
          { x: 0, y: 0 },
          { x: 200, y: 0 },
          { x: 200, y: 60 },
          { x: 0, y: 60 },
        ]),
      ],
      viewBox: '0 0 200 200',
      stroke: '#123456',
      label: () => 'value',
      labelColor: '#abcdef',
    })
    expect(html).toContain('<text')
    expect(html).toContain('paint-order="stroke fill"')
    // Text fill is labelColor; stroke matches polygon stroke.
    expect(html).toMatch(/<text[^>]*fill="#abcdef"/)
    expect(html).toMatch(/<text[^>]*stroke="#123456"/)
  })
})
