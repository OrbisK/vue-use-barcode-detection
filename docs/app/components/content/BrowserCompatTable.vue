<script setup lang="ts">
import { computed } from 'vue'

// Sourced live (with build-time prerender via useFetch) from MDN's
// browser-compat-data so the table stays in sync with the same dataset
// powering the MDN compat tables.
const BCD_URL =
  'https://raw.githubusercontent.com/mdn/browser-compat-data/refs/heads/main/api/BarcodeDetector.json'

interface BcdFlag {
  type: string
  name: string
  value_to_set?: string
}

interface BcdSupportEntry {
  version_added: string | false | null
  version_removed?: string
  partial_implementation?: boolean
  flags?: BcdFlag[]
  notes?: string | string[]
  impl_url?: string
}

type BcdSupport = BcdSupportEntry | BcdSupportEntry[] | 'mirror'

interface BcdData {
  api: {
    BarcodeDetector: {
      __compat: {
        support: Record<string, BcdSupport>
        mdn_url?: string
      }
    }
  }
}

// Mirror-resolution map from the BCD spec — mobile / embedded engines
// inherit their parent's support entry when set to "mirror".
const MIRROR_PARENT: Record<string, string> = {
  chrome_android: 'chrome',
  safari_ios: 'safari',
  firefox_android: 'firefox',
  opera_android: 'opera',
  samsunginternet_android: 'chrome_android',
  webview_android: 'chrome_android',
  webview_ios: 'safari_ios',
  oculus: 'chrome_android',
}

interface BrowserMeta {
  key: string
  name: string
  icon: string
}

const DESKTOP: BrowserMeta[] = [
  { key: 'chrome', name: 'Chrome', icon: 'i-simple-icons-googlechrome' },
  { key: 'edge', name: 'Edge', icon: 'i-simple-icons-microsoftedge' },
  { key: 'firefox', name: 'Firefox', icon: 'i-simple-icons-firefoxbrowser' },
  { key: 'safari', name: 'Safari', icon: 'i-simple-icons-safari' },
  { key: 'opera', name: 'Opera', icon: 'i-simple-icons-opera' },
]

const MOBILE: BrowserMeta[] = [
  { key: 'chrome_android', name: 'Chrome Android', icon: 'i-simple-icons-googlechrome' },
  { key: 'firefox_android', name: 'Firefox Android', icon: 'i-simple-icons-firefoxbrowser' },
  { key: 'safari_ios', name: 'Safari iOS', icon: 'i-simple-icons-safari' },
  { key: 'samsunginternet_android', name: 'Samsung Internet', icon: 'i-simple-icons-samsung' },
  { key: 'opera_android', name: 'Opera Android', icon: 'i-simple-icons-opera' },
]

const { data, error } = await useFetch<BcdData>(BCD_URL, {
  key: 'bcd-barcode-detector',
  server: true,
  // GitHub raw serves the JSON as `text/plain`, so coerce on the way in.
  parseResponse: (txt: string) => JSON.parse(txt) as BcdData,
  default: () => null as unknown as BcdData,
})

const support = computed(() => data.value?.api?.BarcodeDetector?.__compat?.support ?? {})

function resolve(key: string): BcdSupportEntry | null {
  let raw: BcdSupport | undefined = support.value[key]
  // "mirror" can chain (e.g. webview_android → chrome_android → chrome).
  const seen = new Set<string>()
  let cursor = key
  while (raw === 'mirror') {
    if (seen.has(cursor)) return null
    seen.add(cursor)
    cursor = MIRROR_PARENT[cursor] ?? ''
    if (!cursor) return null
    raw = support.value[cursor]
  }
  if (!raw) return null
  // Pick the entry that's still current (no version_removed), falling back
  // to the first array element if all entries describe historical support.
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.find((e) => !e.version_removed) ?? arr[0] ?? null
}

type Status = 'yes' | 'partial' | 'flag' | 'no'

interface Row extends BrowserMeta {
  status: Status
  label: string
  notes: string[]
}

function buildRow(meta: BrowserMeta): Row {
  const entry = resolve(meta.key)
  if (!entry || entry.version_added === false || entry.version_added == null) {
    return { ...meta, status: 'no', label: 'No', notes: noteList(entry?.notes) }
  }
  const version = `${entry.version_added}+`
  const notes = noteList(entry.notes)
  if (entry.flags?.length) {
    const pref = entry.flags.find((f) => f.type === 'preference')
    if (pref) notes.unshift(`Behind preference: ${pref.name}`)
    return { ...meta, status: 'flag', label: `${version} (flag)`, notes }
  }
  if (entry.partial_implementation) {
    return { ...meta, status: 'partial', label: `${version} (partial)`, notes }
  }
  return { ...meta, status: 'yes', label: version, notes }
}

function noteList(notes: string | string[] | undefined): string[] {
  if (!notes) return []
  // Notes are markdown — keep them as-is and let `<MDC>` render them inline.
  return Array.isArray(notes) ? notes : [notes]
}

const desktopRows = computed(() => DESKTOP.map(buildRow))
const mobileRows = computed(() => MOBILE.map(buildRow))

type BadgeColor = 'success' | 'warning' | 'info' | 'error'
const STATUS_COLOR: Record<Status, BadgeColor> = {
  yes: 'success',
  partial: 'warning',
  flag: 'info',
  no: 'error',
}
const STATUS_ICON: Record<Status, string> = {
  yes: 'i-lucide-check',
  partial: 'i-lucide-alert-triangle',
  flag: 'i-lucide-flag',
  no: 'i-lucide-x',
}

const groups = computed(() => [
  { title: 'Desktop', rows: desktopRows.value },
  { title: 'Mobile', rows: mobileRows.value },
])
</script>

<template>
  <div class="my-4 space-y-6 not-prose">
    <UAlert
      v-if="error"
      color="warning"
      variant="soft"
      icon="i-lucide-alert-circle"
      title="Couldn't load browser-compat-data"
      :description="`${error.message}. See MDN for the live table.`"
      :actions="[
        {
          label: 'View on MDN',
          to: 'https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API#browser_compatibility',
          target: '_blank',
          color: 'neutral',
          variant: 'outline',
        },
      ]"
    />

    <template v-else-if="data">
      <section v-for="group in groups" :key="group.title">
        <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {{ group.title }}
        </h4>
        <div class="overflow-hidden rounded-lg ring ring-default">
          <table class="w-full text-sm">
            <tbody>
              <tr
                v-for="(row, i) in group.rows"
                :key="row.key"
                :class="[i > 0 ? 'border-t border-default' : '', 'align-top']"
              >
                <th
                  scope="row"
                  class="whitespace-nowrap py-3 pl-4 pr-3 text-left font-medium text-highlighted"
                >
                  <span class="inline-flex items-center gap-2">
                    <UIcon :name="row.icon" class="size-4 text-muted" />
                    {{ row.name }}
                  </span>
                </th>
                <td class="py-3 pl-3 pr-4">
                  <UBadge
                    :color="STATUS_COLOR[row.status]"
                    variant="soft"
                    :icon="STATUS_ICON[row.status]"
                    :label="row.label"
                  />
                  <ul v-if="row.notes.length" class="mt-2 space-y-0.5 text-xs text-muted">
                    <li v-for="(n, ni) in row.notes" :key="ni">
                      <MDC :value="n" tag="span" unwrap="p" />
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="text-xs text-muted">
        Source:
        <ULink
          to="https://github.com/mdn/browser-compat-data"
          target="_blank"
          class="underline underline-offset-2"
        >
          mdn/browser-compat-data
        </ULink>
        ·
        <ULink
          to="https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API#browser_compatibility"
          target="_blank"
          class="underline underline-offset-2"
        >
          MDN compatibility table
        </ULink>
      </p>
    </template>
  </div>
</template>
