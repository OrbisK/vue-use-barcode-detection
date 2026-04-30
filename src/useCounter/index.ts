import type { Ref } from 'vue'
import { ref } from 'vue'

export interface UseCounterOptions {
  /** Lower bound (inclusive). Defaults to -Infinity. */
  min?: number
  /** Upper bound (inclusive). Defaults to +Infinity. */
  max?: number
}

export interface UseCounterReturn {
  count: Ref<number>
  increment: (delta?: number) => void
  decrement: (delta?: number) => void
  set: (value: number) => void
  reset: () => void
}

/**
 * Reactive counter with optional bounds.
 *
 * @example
 * ```ts
 * const { count, increment, decrement, reset } = useCounter(0, { min: 0, max: 10 })
 * ```
 */
export function useCounter(initialValue = 0, options: UseCounterOptions = {}): UseCounterReturn {
  const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = options

  const clamp = (value: number): number => Math.min(Math.max(value, min), max)

  const count = ref(clamp(initialValue))

  function increment(delta = 1): void {
    count.value = clamp(count.value + delta)
  }

  function decrement(delta = 1): void {
    count.value = clamp(count.value - delta)
  }

  function set(value: number): void {
    count.value = clamp(value)
  }

  function reset(): void {
    count.value = clamp(initialValue)
  }

  return { count, increment, decrement, set, reset }
}
