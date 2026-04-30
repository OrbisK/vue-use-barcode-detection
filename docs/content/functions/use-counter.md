---
title: useCounter
description: Reactive counter with optional bounds.
---

# useCounter

Reactive counter with optional bounds.

## Usage

```ts
import { useCounter } from '@orbiks/vueuse-barcode-detection'

const { count, increment, decrement, set, reset } = useCounter(0, {
  min: 0,
  max: 10,
})
```

## Options

| Name  | Type     | Default     | Description              |
| ----- | -------- | ----------- | ------------------------ |
| `min` | `number` | `-Infinity` | Lower bound (inclusive). |
| `max` | `number` | `+Infinity` | Upper bound (inclusive). |

## Returns

| Name                | Type                       | Description                                        |
| ------------------- | -------------------------- | -------------------------------------------------- |
| `count`             | `Ref<number>`              | The current value.                                 |
| `increment(delta?)` | `(delta?: number) => void` | Increase by `delta` (default 1), clamped to `max`. |
| `decrement(delta?)` | `(delta?: number) => void` | Decrease by `delta` (default 1), clamped to `min`. |
| `set(value)`        | `(value: number) => void`  | Set absolute value, clamped.                       |
| `reset()`           | `() => void`               | Reset to the (clamped) initial value.              |
