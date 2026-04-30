<script setup lang="ts">
import { useCounter } from '@orbiks/vueuse-barcode-detection'

const { count, increment, decrement, reset } = useCounter(0, { min: 0, max: 10 })
</script>

<template>
  <main>
    <h1>@orbiks/vueuse-barcode-detection playground</h1>
    <p>Live edit the source in <code>../src/</code> — changes hot-reload here.</p>

    <section>
      <h2>useCounter</h2>
      <div class="counter">
        <button type="button" :disabled="count <= 0" @click="decrement()">-</button>
        <output>{{ count }}</output>
        <button type="button" :disabled="count >= 10" @click="increment()">+</button>
        <button type="button" @click="reset()">reset</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
main {
  font-family: ui-sans-serif, system-ui, sans-serif;
  max-width: 40rem;
  margin: 2rem auto;
  padding: 0 1rem;
}
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
output {
  min-width: 2ch;
  text-align: center;
}
</style>
