import { renderToString } from '@vue/server-renderer'
import type { VNodeRef } from 'vue'
import { createSSRApp, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { UseBarcodeDetector } from './detector.js'

describe('UseBarcodeDetector — SSR', () => {
  it('renders without throwing on the server', async () => {
    const app = createSSRApp({
      render: () => h(UseBarcodeDetector),
    })
    const html = await renderToString(app)
    expect(html).toContain('<video')
    expect(html).toContain('use-barcode-detector')
    // Default overlay must not render server-side — `detected` is empty.
    expect(html).not.toContain('<svg')
  })

  it('emits no overlay during SSR even with the slot rendered', async () => {
    const app = createSSRApp({
      render: () =>
        h(UseBarcodeDetector, null, {
          default: ({ detected, isActive }: { detected: unknown[]; isActive: boolean }) =>
            h('p', { 'data-state': `${detected.length}-${isActive}` }, 'slot'),
        }),
    })
    const html = await renderToString(app)
    expect(html).toContain('data-state="0-false"')
    expect(html).not.toContain('<svg')
  })

  it('reports `isSupported` as false during SSR (avoids hydration mismatch)', async () => {
    let captured: boolean | null = null
    const app = createSSRApp({
      render: () =>
        h(UseBarcodeDetector, null, {
          default: ({ isSupported }: { isSupported: boolean }) => {
            captured = isSupported
            return h('span')
          },
        }),
    })
    await renderToString(app)
    expect(captured).toBe(false)
  })

  it('skips the stage entirely in `headless` mode on the server', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          UseBarcodeDetector,
          { headless: true },
          {
            default: ({ setSource }: { setSource: (el: Element | null) => void }) =>
              h('video', { ref: setSource as VNodeRef, 'data-test': 'custom' }),
          },
        ),
    })
    const html = await renderToString(app)
    expect(html).toContain('data-test="custom"')
    expect(html).not.toContain('class="use-barcode-detector"')
  })
})
