import { describe, expect, it } from 'vitest'
import { useBarcodeDetector } from './index.js'

describe('useBarcodeDetector', () => {
  it('reports unsupported environments via `isSupported`', () => {
    const { isSupported } = useBarcodeDetector(null, { immediate: false })
    expect(isSupported.value).toBe(false)
  })

  it('starts inactive with empty detection state', () => {
    const { isActive, detected, error, supportedFormats } = useBarcodeDetector(null, {
      immediate: false,
    })
    expect(isActive.value).toBe(false)
    expect(detected.value).toEqual([])
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
})
