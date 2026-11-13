<script setup lang="ts">
// Renders a ```markmap code block as an interactive mind map with <markmap-view> (@markmap/element).
// @markmap/element does nothing on the server, so the map is created in the browser only.
// A spinner shows until the map has been drawn and fitted into its frame; the map stays hidden
// until then, so it never appears off-centre.
const props = defineProps<{ markdown?: string }>()

const { themePref } = useTheme()
const colorScheme = computed(() => (themePref.value === 'system' ? 'auto' : themePref.value))

const el = ref<HTMLElement | null>(null)
const ready = ref(false)

const uid = Math.random().toString(36).slice(2, 6)
const t0 = typeof performance !== 'undefined' ? performance.now() : 0
const log = (msg: string) =>
  console.debug(`[markmap ${uid}] ${msg} (+${Math.round(performance.now() - t0)} ms)`)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

let started = false // never initialise the same component twice
let touched = false // the reader zoomed / panned / used the toolbar: stop re-fitting for them
let disposed = false
let fitTimer: ReturnType<typeof setTimeout> | undefined
let fitCount = 0
let resizeObserver: ResizeObserver | undefined
let lastWidth = 0

// Fit the whole map into the frame (the Markmap object is `el.mm`).
async function fit() {
  const mm = (el.value as any)?.mm
  if (!mm || typeof mm.fit !== 'function') return
  try {
    await Promise.race([Promise.resolve(mm.fit()), sleep(1200)])
  } catch {
    /* the map is still usable without a fit */
  }
}

// The element can draw more than once (after the theme attribute is set, after fonts load...),
// and each draw can move the map. So fit again after every render until the reader touches it.
function scheduleFit(delay = 60) {
  if (disposed) return
  clearTimeout(fitTimer)
  fitTimer = setTimeout(async () => {
    if (disposed) return
    await nextFrame()
    if (!touched && fitCount < 8) {
      fitCount++
      await fit()
      log(`fit #${fitCount}`)
    }
    ready.value = true
  }, delay)
}

onMounted(async () => {
  if (started) return
  started = true
  log('mounted')
  const spinnerGuard = setTimeout(() => (ready.value = true), 5000) // never spin forever

  try {
    await import('@markmap/element')
    await customElements.whenDefined('markmap-view')
    log('element loaded')

    // <ClientOnly> renders its content a tick after mount, so wait for the element itself.
    for (let i = 0; i < 80 && !el.value; i++) await sleep(25)
    const view = el.value as any
    if (!view || disposed) return

    view.addEventListener('render', () => scheduleFit(60))
    for (const type of ['pointerdown', 'wheel', 'touchstart'])
      view.addEventListener(type, () => (touched = true), { passive: true })

    view.markdown = props.markdown ?? ''

    // Wait (at most 3 s) for the Markmap object, then fit it.
    for (let i = 0; i < 60 && !view.mm; i++) await sleep(50)
    log(view.mm ? 'map created' : 'map NOT created')
    scheduleFit(0)

    // Re-fit when the frame changes width (phone rotation, window resize).
    lastWidth = view.clientWidth
    resizeObserver = new ResizeObserver(() => {
      const w = view.clientWidth
      if (Math.abs(w - lastWidth) > 24) {
        lastWidth = w
        fitCount = 0
        scheduleFit(120)
      }
    })
    resizeObserver.observe(view)
  } catch (err) {
    console.error(`[markmap ${uid}] failed`, err)
    ready.value = true
  } finally {
    clearTimeout(spinnerGuard)
  }
})

onBeforeUnmount(() => {
  disposed = true
  log('unmounted')
  clearTimeout(fitTimer)
  resizeObserver?.disconnect()
})

watch(
  () => props.markdown,
  (md, old) => {
    if (!el.value || md === old) return
    touched = false
    fitCount = 0
    ;(el.value as any).markdown = md ?? ''
    scheduleFit(120)
  },
)
</script>

<template>
  <div class="markmap-block not-prose" :class="{ 'is-ready': ready }">
    <div v-if="!ready" class="markmap-loading" aria-live="polite">
      <span class="i-svg-spinners:bars-rotate-fade text-3xl" />
    </div>
    <ClientOnly>
      <markmap-view ref="el" class="markmap-view" :color-scheme="colorScheme" toolbar />
    </ClientOnly>
  </div>
</template>

<style>
/* Frame: a glass panel that matches the page (orange-50 / slate-900) and the tables. The map's own
   background is transparent, and color-scheme makes markmap pick light or dark text, so the
   text always contrasts with this panel. */
.markmap-block {
  --mm-panel-bg: color-mix(in srgb, #fff7ed 90%, #7c3aed);
  --mm-panel-line: rgba(100, 116, 139, 0.3);
  --mm-panel-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
  --mm-panel-glow: rgba(255, 255, 255, 0.7);

  position: relative;
  width: 100%;
  height: 28rem;
  margin: 1.5em 0;
  overflow: hidden;
  border: 1px solid var(--mm-panel-line);
  border-radius: 1rem;
  background: var(--mm-panel-bg);
  backdrop-filter: blur(14px) saturate(1.4);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  box-shadow:
    inset 0 1px 0 var(--mm-panel-glow),
    var(--mm-panel-shadow);
}
.dark .markmap-block {
  --mm-panel-bg: color-mix(in srgb, #0f172a 88%, #a78bfa);
  --mm-panel-line: rgba(148, 163, 184, 0.22);
  --mm-panel-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  --mm-panel-glow: rgba(255, 255, 255, 0.07);
}

.markmap-view {
  display: block;
  width: 100%;
  height: 100%;
  --mm-bg: transparent;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.markmap-block.is-ready .markmap-view {
  opacity: 1;
}

.markmap-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}
</style>
