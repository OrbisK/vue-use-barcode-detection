import { describe, expect, it } from 'vitest'
import { useCounter } from './index.js'

describe('useCounter', () => {
  it('starts at the provided initial value', () => {
    const { count } = useCounter(7)
    expect(count.value).toBe(7)
  })

  it('increments and decrements', () => {
    const { count, increment, decrement } = useCounter(0)
    increment()
    increment(2)
    decrement()
    expect(count.value).toBe(2)
  })

  it('clamps to min/max bounds', () => {
    const { count, increment, decrement } = useCounter(0, { min: 0, max: 5 })
    decrement(10)
    expect(count.value).toBe(0)
    increment(100)
    expect(count.value).toBe(5)
  })

  it('reset returns to the (clamped) initial value', () => {
    const { count, increment, reset } = useCounter(3, { max: 5 })
    increment(10)
    reset()
    expect(count.value).toBe(3)
  })
})
