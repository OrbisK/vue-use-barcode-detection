<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'

interface DetectedBarcode {
  rawValue: string
  format: string
  boundingBox: DOMRectReadOnly
  cornerPoints: { x: number; y: number }[]
}

const video = useTemplateRef<HTMLVideoElement>('video')
const supported = shallowRef<boolean>('BarcodeDetector' in window)
const supportedFormats = shallowRef<string[]>([])
const detected = shallowRef<DetectedBarcode[]>([])
const error = shallowRef<string | null>(null)

let stream: MediaStream | null = null
let detector: any = null
let rafId: number | null = null

async function start() {
  if (!supported.value) {
    error.value = '`BarcodeDetector` is not available in this browser.'
    return
  }

  try {
    supportedFormats.value = await (window as any).BarcodeDetector.getSupportedFormats()
    detector = new (window as any).BarcodeDetector({ formats: supportedFormats.value })

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })

    const el = video.value!
    el.srcObject = stream
    await el.play()

    const tick = async () => {
      if (!detector || !video.value) return
      try {
        detected.value = await detector.detect(video.value)
      } catch (e) {
        // detect() can throw transiently while the video isn't ready; ignore
        console.debug('detect failed', e)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
}

function stop() {
  if (rafId != null) cancelAnimationFrame(rafId)
  rafId = null
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  detector = null
  if (video.value) video.value.srcObject = null
  detected.value = []
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <main>
    <h1>@orbiks/vueuse-barcode-detection playground</h1>

    <section>
      <h2>Barcode detector POC</h2>
      <p v-if="!supported" class="error">
        <code>BarcodeDetector</code> is not available in this browser.
      </p>
      <p v-if="error" class="error">{{ error }}</p>
      <p>
        Supported formats: <code>{{ supportedFormats.join(', ') || '—' }}</code>
      </p>

      <div class="stage">
        <video ref="video" playsinline muted autoplay />
        <svg
          v-if="detected.length"
          class="overlay"
          :viewBox="`0 0 ${video?.videoWidth ?? 0} ${video?.videoHeight ?? 0}`"
          preserveAspectRatio="none"
        >
          <polygon
            v-for="(b, i) in detected"
            :key="i"
            :points="b.cornerPoints.map((p) => `${p.x},${p.y}`).join(' ')"
            class="box"
          />
        </svg>
      </div>

      <ul class="results">
        <li v-for="(b, i) in detected" :key="i">
          <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
        </li>
        <li v-if="!detected.length" class="muted">
          No barcode detected yet — point the camera at one.
        </li>
      </ul>
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
.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}
.stage video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.box {
  fill: rgba(0, 200, 120, 0.15);
  stroke: rgb(0, 200, 120);
  stroke-width: 4;
}
.results {
  margin-top: 1rem;
  padding: 0;
  list-style: none;
  font-family: ui-monospace, monospace;
  font-size: 0.9rem;
}
.results li {
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
  word-break: break-all;
}
.muted {
  color: #888;
}
.error {
  color: crimson;
}
</style>
