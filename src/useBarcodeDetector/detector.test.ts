import { describe, expect, it } from 'vitest'
import { UseBarcodeDetector } from './detector.js'

describe('UseBarcodeDetector (component)', () => {
  it('is a defined Vue component', () => {
    expect(UseBarcodeDetector).toBeDefined()
    expect(UseBarcodeDetector.name).toBe('UseBarcodeDetector')
  })

  it('declares the expected props', () => {
    const props = UseBarcodeDetector.props as Record<string, { default: unknown }>
    expect(props).toHaveProperty('formats')
    expect(props).toHaveProperty('immediate')
    expect(props).toHaveProperty('camera')
    expect(props).toHaveProperty('headless')
    expect(props.immediate.default).toBe(true)
    expect(props.camera.default).toBe(true)
    expect(props.headless.default).toBe(false)
  })
})
