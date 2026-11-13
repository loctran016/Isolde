<script setup lang="ts">
// Renders a ```markmap code block as an interactive mind map with <markmap-view>.
// @markmap/element does nothing on the server, so the map is created in the browser only.
// Until the map is drawn and fitted into its frame, a spinner is shown and the map stays hidden,
// so it never appears off-centre.
const props = defineProps<{ markdown?: string }>()

const { themePref } = useTheme()
const colorScheme = computed(() => (themePref.value === 'system' ? 'auto' : themePref.value))

const el = ref<HTMLElement | null>(null)
const ready = ref(false)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

// Fit the whole map into the frame (the map object is `el.mm`).
async function fit() {
  const mm = (el.value as any)?.mm
  if (!mm?.fit) return
  try {
    await Promise.race([Promise.resolve(mm.fit()), sleep(1500)])
  } catch {
    /* ignore: the map is still usable without a fit */
  }
}

let resizeObserver: ResizeObserver | undefined
let lastWidth = 0

onMounted(async () => {
  await import('@markmap/element')
  await customElements.whenDefined('markmap-view')
  const view = el.value as any
  if (!view) return

  // First render: wait until the browser has laid the frame out, fit the map, then reveal it.
  const firstRender = new Promise<void>((resolve) => {
    view.addEventListener('render', () => resolve(), { once: true })
    setTimeout(resolve, 4000) // never leave the spinner on forever
  })
  view.markdown = props.markdown ?? ''
  await firstRender
  await nextFrame()
  await fit()
  ready.value = true

  // Re-fit when the frame changes width (phone rotation, window resize), not on every pixel.
  lastWidth = view.clientWidth
  resizeObserver = new ResizeObserver(() => {
    const w = view.clientWidth
    if (Math.abs(w - lastWidth) > 24) {
      lastWidth = w
      fit()
    }
  })
  resizeObserver.observe(view)
})

onBeforeUnmount(() => resizeObserver?.disconnect())

watch(
  () => props.markdown,
  async (md) => {
    if (!el.value) return
    ;(el.value as any).markdown = md ?? ''
    await nextFrame()
    await fit()
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
