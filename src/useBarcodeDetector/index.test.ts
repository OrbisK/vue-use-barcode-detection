import { describe, expect, it } from 'vitest'
import { useBarcodeDetector } from './index.js'

describe('useBarcodeDetector', () => {
  it('reports unsupported environments via `isSupported`', () => {
    const { isSupported } = useBarcodeDetector(null, { immediate: false })
    expect(isSupported.value).toBe(false)
  })

  it('starts inactive with empty detection state', () => {
    const { isActive, detected, rejected, error, supportedFormats } = useBarcodeDetector(null, {
      immediate: false,
    })
    expect(isActive.value).toBe(false)
    expect(detected.value).toEqual([])
    expect(rejected.value).toEqual([])
    expect(error.value).toBeNull()
    expect(supportedFormats.value).toEqual([])
  })

  it('start() is a no-op when the source is not a video element', async () => {
    const { error, isActive, start } = useBarcodeDetector(null, { immediate: false })
    await start()
    expect(isActive.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('stop is a noop when never started', () => {
    const { stop, isActive } = useBarcodeDetector(null, { immediate: false })
    expect(() => stop()).not.toThrow()
    expect(isActive.value).toBe(false)
  })

  it('detect() returns [] when source is nullish', async () => {
    const { detect } = useBarcodeDetector(null, { immediate: false })
    expect(await detect()).toEqual([])
    expect(await detect(null)).toEqual([])
  })

  it('detect() surfaces unsupported environments via `error`', async () => {
    const { detect, error } = useBarcodeDetector(null, { immediate: false })
    // Pass a fake-but-truthy source so we get past the nullish guard
    await detect({} as unknown as Blob)
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toMatch(/BarcodeDetector/)
  })

  it('accepts `once` as a boolean and `accept` as a predicate', () => {
    expect(() => useBarcodeDetector(null, { immediate: false, once: true })).not.toThrow()
    expect(() => useBarcodeDetector(null, { immediate: false, once: false })).not.toThrow()
    expect(() =>
      useBarcodeDetector(null, {
        immediate: false,
        accept: (b) => b.format === 'qr_code',
      }),
    ).not.toThrow()
    expect(() =>
      useBarcodeDetector(null, {
        immediate: false,
        once: true,
        accept: (b) => b.rawValue.startsWith('XX-'),
      }),
    ).not.toThrow()
  })

  it('partitions detections into `detected` and `rejected` via `accept`', async () => {
    const result = [
      { rawValue: 'hello', format: 'qr_code', boundingBox: {}, cornerPoints: [] },
      { rawValue: '12345', format: 'code_128', boundingBox: {}, cornerPoints: [] },
    ]
    class FakeBarcodeDetector {
      static getSupportedFormats() {
        return Promise.resolve(['qr_code', 'code_128'])
      }
      detect = () => Promise.resolve(result)
    }
    const win = { BarcodeDetector: FakeBarcodeDetector } as unknown as Window
    const seen: string[] = []
    const { detect, detected, rejected } = useBarcodeDetector(null, {
      immediate: false,
      accept: (b) => {
        seen.push(b.rawValue)
        return b.rawValue.startsWith('hello')
      },
      window: win,
    })
    const out = await detect({} as Blob)
    // `accept` filters the return value + `detected.value`; rejects land in `rejected.value`.
    expect(out).toEqual([result[0]])
    expect(detected.value).toEqual([result[0]])
    expect(rejected.value).toEqual([result[1]])
    expect(seen).toEqual(['hello', '12345'])
  })

  it('returns the unfiltered list and an empty `rejected` when `accept` is omitted', async () => {
    const result = [
      { rawValue: 'a', format: 'qr_code', boundingBox: {}, cornerPoints: [] },
      { rawValue: 'b', format: 'code_128', boundingBox: {}, cornerPoints: [] },
    ]
    class FakeBarcodeDetector {
      static getSupportedFormats() {
        return Promise.resolve(['qr_code', 'code_128'])
      }
      detect = () => Promise.resolve(result)
    }
    const win = { BarcodeDetector: FakeBarcodeDetector } as unknown as Window
    const { detect, detected, rejected } = useBarcodeDetector(null, {
      immediate: false,
      window: win,
    })
    const out = await detect({} as Blob)
    expect(out).toEqual(result)
    expect(detected.value).toEqual(result)
    expect(rejected.value).toEqual([])
  })
})
