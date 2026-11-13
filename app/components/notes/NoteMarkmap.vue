<script setup lang="ts">
// Renders a ```markmap code block as an interactive mind map, using @markmap/parse + @markmap/view
// directly (no web component), so we decide exactly when the map is created and fitted.
// A spinner shows until the map is drawn and fitted into its frame; the map stays hidden until
// then, so it never appears off-centre.
const props = defineProps<{ markdown?: string }>()

const { themePref } = useTheme()
const colorScheme = computed(() => (themePref.value === 'system' ? 'auto' : themePref.value))

const svg = ref<SVGSVGElement | null>(null)
const frame = ref<HTMLElement | null>(null)
const ready = ref(false)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

let mm: any = null
let parseFn: any = null
let resolveViewOptions: any = null
let touched = false // the reader zoomed / panned / used a button: stop re-fitting for them
let disposed = false
let resizeObserver: ResizeObserver | undefined
let lastWidth = 0
const t0 = performance.now()
const log = (msg: string, ...rest: unknown[]) =>
  console.debug(`[markmap] ${msg} (+${Math.round(performance.now() - t0)} ms)`, ...rest)

async function fit() {
  if (!mm?.fit) return
  try {
    await Promise.race([Promise.resolve(mm.fit()), sleep(1200)])
  } catch {
    /* the map is still usable without a fit */
  }
}

function build(markdown: string) {
  const { root, frontmatter } = parseFn(markdown)
  const { options, warnings } = resolveViewOptions(
    { colorScheme: colorScheme.value },
    frontmatter?.markmap,
  )
  if (warnings?.length) log('ignored options', warnings)
  return { root, options }
}

onMounted(async () => {
  const [parseMod, viewMod] = await Promise.all([import('@markmap/parse'), import('@markmap/view')])
  parseFn = (parseMod as any).parse
  resolveViewOptions = (viewMod as any).resolveViewOptions
  const { Markmap } = viewMod as any
  log('packages loaded')

  // <ClientOnly> renders its content a tick after mount, so wait for the <svg> itself.
  for (let i = 0; i < 80 && !svg.value; i++) await sleep(25)
  if (!svg.value || disposed) return

  const { root, options } = build(props.markdown ?? '')
  mm = Markmap.create(svg.value, root, options)
  log('map created')

  // Fit once the frame has been laid out, once more after the first draw has settled.
  await nextFrame()
  await fit()
  ready.value = true
  log('fitted, revealed')
  setTimeout(() => {
    if (!touched && !disposed) fit()
  }, 350)

  // Re-fit when the frame changes width (phone rotation, window resize).
  lastWidth = frame.value?.clientWidth ?? 0
  resizeObserver = new ResizeObserver(() => {
    const w = frame.value?.clientWidth ?? 0
    if (Math.abs(w - lastWidth) > 24) {
      lastWidth = w
      if (!touched) fit()
    }
  })
  if (frame.value) resizeObserver.observe(frame.value)
})

onBeforeUnmount(() => {
  disposed = true
  resizeObserver?.disconnect()
  try {
    mm?.destroy?.()
  } catch {
    /* ignore */
  }
})

watch(colorScheme, (cs) => {
  try {
    mm?.setOptions?.({ colorScheme: cs })
  } catch {
    /* option not supported: the CSS colour on the frame still applies */
  }
})

watch(
  () => props.markdown,
  async (md) => {
    if (!mm || !parseFn) return
    touched = false
    const { root, options } = build(md ?? '')
    await mm.setTree(root, options)
    await nextFrame()
    await fit()
  },
)

const zoomIn = () => ((touched = true), mm?.zoomIn?.())
const zoomOut = () => ((touched = true), mm?.zoomOut?.())
const refit = () => ((touched = false), fit())
</script>

<template>
  <div ref="frame" class="markmap-block not-prose" :class="{ 'is-ready': ready }">
    <div v-if="!ready" class="markmap-loading" aria-live="polite">
      <span class="i-svg-spinners:bars-rotate-fade text-3xl" />
    </div>
    <ClientOnly>
      <svg
        ref="svg"
        class="markmap-svg"
        @pointerdown.passive="touched = true"
        @wheel.passive="touched = true"
        @touchstart.passive="touched = true"
      />
      <div v-if="ready" class="markmap-tools">
        <button type="button" aria-label="Phóng to" @click="zoomIn">+</button>
        <button type="button" aria-label="Thu nhỏ" @click="zoomOut">−</button>
        <button type="button" aria-label="Căn vừa khung" @click="refit">⤢</button>
      </div>
    </ClientOnly>
  </div>
</template>

<style>
/* Frame: a glass panel that matches the page (orange-50 / slate-900) and the tables.
   The map is drawn on top of it, so the text colour is set here to always contrast with it. */
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
  color: #1c1917; /* stone-900 */
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
  color: #e2e8f0; /* slate-200 */
}

.markmap-svg {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.markmap-block.is-ready .markmap-svg {
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

/* zoom buttons: small glass pills in the bottom-right corner */
.markmap-tools {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--mm-panel-line);
  border-radius: 9999px;
  background: color-mix(in srgb, var(--mm-panel-bg) 70%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.markmap-tools button {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 9999px;
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.markmap-tools button:hover {
  background: rgba(124, 58, 237, 0.18);
}
</style>
