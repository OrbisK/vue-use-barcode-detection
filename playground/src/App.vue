<script setup lang="ts">
import { ref, shallowRef, useTemplateRef } from 'vue'
import {
  UseBarcodeDetector,
  type UseBarcodeDetectorReturn,
  useBarcodeDetector,
} from '@orbisk/vue-use-barcode-detection'

// 1. Live camera stream
const video = useTemplateRef<HTMLVideoElement>('video')
const {
  isSupported,
  supportedFormats,
  detected: streamDetected,
  error: streamError,
} = useBarcodeDetector(video)

// 2. Manual: video element with a "Scan" button instead of a continuous loop
const manualVideo = useTemplateRef<HTMLVideoElement>('manualVideo')
const {
  detect: detectManual,
  detected: manualDetected,
  error: manualError,
  start: startManual,
  stop: stopManual,
  isActive: manualActive,
} = useBarcodeDetector(manualVideo, { immediate: false, camera: false })

let manualStream: MediaStream | null = null

async function enableManualCamera() {
  if (manualStream) return
  manualStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  })
  if (manualVideo.value) {
    manualVideo.value.srcObject = manualStream
    await manualVideo.value.play()
  }
}

function disableManualCamera() {
  stopManual()
  manualStream?.getTracks().forEach((t) => t.stop())
  manualStream = null
  if (manualVideo.value) manualVideo.value.srcObject = null
}

async function scanFrame() {
  if (!manualStream) await enableManualCamera()
  await detectManual()
}

// 3. Image upload
const uploadedUrl = shallowRef<string | null>(null)
const uploadImg = useTemplateRef<HTMLImageElement>('uploadImg')
const {
  detect: detectImage,
  detected: imageDetected,
  error: imageError,
} = useBarcodeDetector(uploadImg, { immediate: false })

function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (uploadedUrl.value) URL.revokeObjectURL(uploadedUrl.value)
  uploadedUrl.value = URL.createObjectURL(file)
}

async function onImageLoad() {
  await detectImage()
}

// 5. Scan once
const oncePrefix = ref('')
const onceScanner = useTemplateRef<UseBarcodeDetectorReturn>('onceScanner')
function onceMatches(b: { rawValue: string }) {
  return oncePrefix.value ? b.rawValue.startsWith(oncePrefix.value) : true
}
function rearmOnce() {
  void onceScanner.value?.start()
}
</script>

<template>
  <main>
    <h1>@orbisk/vue-use-barcode-detection playground</h1>

    <p v-if="!isSupported" class="error">
      <code>BarcodeDetector</code> is not available in this browser.
    </p>
    <p>
      Supported formats: <code>{{ supportedFormats.join(', ') || '—' }}</code>
    </p>

    <section>
      <h2>1. Live camera (continuous)</h2>
      <p v-if="streamError" class="error">{{ streamError.message }}</p>

      <div class="stage">
        <video ref="video" playsinline muted autoplay />
        <svg
          v-if="streamDetected.length"
          class="overlay"
          :viewBox="`0 0 ${video?.videoWidth ?? 0} ${video?.videoHeight ?? 0}`"
          preserveAspectRatio="xMidYMid slice"
        >
          <polygon
            v-for="(b, i) in streamDetected"
            :key="i"
            :points="b.cornerPoints.map((p) => `${p.x},${p.y}`).join(' ')"
            class="box"
          />
        </svg>
      </div>

      <ul class="results">
        <li v-for="(b, i) in streamDetected" :key="i">
          <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
        </li>
        <li v-if="!streamDetected.length" class="muted">
          No barcode detected yet — point the camera at one.
        </li>
      </ul>
    </section>

    <section>
      <h2>2. Manual scan (video + button)</h2>
      <p>
        Camera streams without continuous detection. Press <em>Scan</em> to detect the current
        frame.
      </p>
      <p v-if="manualError" class="error">{{ manualError.message }}</p>

      <div class="stage">
        <video ref="manualVideo" playsinline muted autoplay />
      </div>

      <div class="controls">
        <button v-if="!manualStream" type="button" @click="enableManualCamera">
          Enable camera
        </button>
        <template v-else>
          <button type="button" @click="scanFrame">Scan</button>
          <button v-if="!manualActive" type="button" @click="startManual">Start continuous</button>
          <button v-else type="button" @click="stopManual">Stop continuous</button>
          <button type="button" @click="disableManualCamera">Disable camera</button>
        </template>
      </div>

      <ul class="results">
        <li v-for="(b, i) in manualDetected" :key="i">
          <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
        </li>
        <li v-if="!manualDetected.length" class="muted">Nothing scanned yet.</li>
      </ul>
    </section>

    <section>
      <h2>3. All-in-one component</h2>
      <p>
        <code>&lt;UseBarcodeDetector /&gt;</code> renders the video and a default overlay. The
        default slot exposes the composable state alongside.
      </p>
      <UseBarcodeDetector v-slot="{ detected, error: cmpError }" class="ubd-stage">
        <p v-if="cmpError" class="error">{{ cmpError.message }}</p>
        <ul class="results">
          <li v-for="(b, i) in detected" :key="i">
            <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
          </li>
          <li v-if="!detected.length" class="muted">Point the camera at a barcode.</li>
        </ul>
      </UseBarcodeDetector>
    </section>

    <section>
      <h2>4. Image upload</h2>
      <p>Pick a still image — detection runs once it loads.</p>
      <p v-if="imageError" class="error">{{ imageError.message }}</p>

      <input type="file" accept="image/*" @change="onFile" />

      <div v-if="uploadedUrl" class="stage">
        <img
          ref="uploadImg"
          :src="uploadedUrl"
          alt="uploaded barcode"
          crossorigin="anonymous"
          @load="onImageLoad"
        />
        <svg
          v-if="imageDetected.length"
          class="overlay"
          :viewBox="`0 0 ${uploadImg?.naturalWidth ?? 0} ${uploadImg?.naturalHeight ?? 0}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <polygon
            v-for="(b, i) in imageDetected"
            :key="i"
            :points="b.cornerPoints.map((p) => `${p.x},${p.y}`).join(' ')"
            class="box"
          />
        </svg>
      </div>

      <ul class="results">
        <li v-for="(b, i) in imageDetected" :key="i">
          <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
        </li>
        <li v-if="uploadedUrl && !imageDetected.length" class="muted">
          No barcode found in the uploaded image.
        </li>
      </ul>
    </section>

    <section>
      <h2>5. Scan once</h2>
      <p>
        Stops the camera as soon as a matching barcode is detected. Leave the prefix empty to stop
        on the first barcode of any kind, or type a few characters to filter by
        <code>rawValue</code>.
      </p>

      <label>
        Required prefix:
        <input v-model="oncePrefix" type="text" placeholder="(any)" />
      </label>

      <UseBarcodeDetector
        ref="onceScanner"
        :once="onceMatches"
        class="ubd-stage"
        v-slot="{ detected, isActive, error: onceError }"
      >
        <p v-if="onceError" class="error">{{ onceError.message }}</p>
        <p>
          <strong>{{ isActive ? 'Scanning…' : 'Stopped.' }}</strong>
          <button v-if="!isActive" type="button" @click="rearmOnce">Scan again</button>
        </p>
        <ul class="results">
          <li v-for="(b, i) in detected" :key="i">
            <strong>{{ b.format }}</strong> — <code>{{ b.rawValue }}</code>
          </li>
          <li v-if="!detected.length" class="muted">Nothing scanned yet.</li>
        </ul>
      </UseBarcodeDetector>
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
section {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}
section:first-of-type {
  border-top: none;
  padding-top: 0;
}
.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 0.5rem;
}
.stage video,
.stage img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.stage video {
  object-fit: cover;
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
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.controls button {
  padding: 0.4rem 0.9rem;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  font: inherit;
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
.ubd-stage :deep(.use-barcode-detector) {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}
input[type='file'],
input[type='text'] {
  font: inherit;
}
input[type='text'] {
  margin-left: 0.5rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
}
section button {
  margin-left: 0.5rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  font: inherit;
}
</style>
