<script setup lang="ts">
import { useCounter } from '@orbiks/vueuse-barcode-detection'

const { count, increment, decrement, reset } = useCounter(0, { min: 0, max: 10 })
</script>

<template>
  <div class="counter">
    <button type="button" :disabled="count <= 0" @click="decrement()">-</button>
    <span>{{ count }}</span>
    <button type="button" :disabled="count >= 10" @click="increment()">+</button>
    <button type="button" @click="reset()">reset</button>
  </div>
</template>

<style scoped>
.counter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ui-monospace, monospace;
}
button {
  padding: 0.25rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
span {
  min-width: 2ch;
  text-align: center;
}
</style>
