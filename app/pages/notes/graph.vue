<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

const island = getIsland('/notes')!
useHead({ title: 'Graph' })
definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

type GNode = { id: string; name: string; group: string; deg?: number }
type GLink = { source: string; target: string }

const { data: nav } = await useAsyncData('notes-nav', () => clientContent.navigation())

const pathByStem = computed(() => {
  const m = new Map<string, string>()
  const walk = (items: NavigationItem[] = []) => {
    for (const i of items) {
      if (i.stem && i.page !== false) m.set(i.stem, i.path)
      walk(i.children)
    }
  }
  walk(nav.value)
  return m
})

const PALETTE = [
  '#c084fc',
  '#f472b6',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#fb923c',
  '#a3e635',
  '#22d3ee',
]

const container = ref<HTMLDivElement>()
const groups = ref<{ name: string; color: string }[]>([])
const selected = ref<string | null>(null)
const selectedName = ref('')
let graph: any
let ro: ResizeObserver | undefined
let cleanup: (() => void) | undefined

// Auto-fit only until the user starts panning/zooming (so a tap never resets the view)
let userMoved = false
function fit(ms = 400) {
  if (!graph || userMoved) return
  graph.zoomToFit(ms, 40)
}
function refit() {
  userMoved = false
  fit(300)
}

// ---- Full screen (the overlay is the default; the real Fullscreen API is a bonus) ----
const full = ref(true)
const shell = ref<HTMLElement>()
const { isSupported, isFullscreen, enter, exit } = useFullscreen(shell)

async function setFull(value: boolean) {
  full.value = value
  if (!isSupported.value) return
  try {
    if (value) await enter()
    else if (isFullscreen.value) await exit()
  } catch {}
}

// Leaving real fullscreen with Esc / the browser UI also closes the overlay
watch(isFullscreen, (now, before) => {
  if (before && !now) full.value = false
})

onKeyStroke('Escape', () => {
  if (full.value) setFull(false)
})

// Re-fit the view when switching between card and full screen
watch(full, async () => {
  await nextTick()
  userMoved = false
  setTimeout(() => fit(300), 150)
})

onMounted(async () => {
  const [{ default: ForceGraph }, data] = await Promise.all([
    import('force-graph'),
    $fetch<{ nodes: GNode[]; links: GLink[] }>('/graph.json'),
  ])
  const el = container.value!

  const dark =
    matchMedia('(prefers-color-scheme: dark)').matches ||
    document.documentElement.classList.contains('dark')
  const text = dark ? '#f5f3ff' : '#1c1917'
  const edge = dark ? 'rgba(216,180,254,0.35)' : 'rgba(88,28,135,0.35)'
  const faint = dark ? 'rgba(216,180,254,0.08)' : 'rgba(88,28,135,0.08)'

  const names = [...new Set(data.nodes.map((n) => n.group))].sort()
  const color = new Map(names.map((n, i) => [n, PALETTE[i % PALETTE.length]]))
  groups.value = names.map((name) => ({ name, color: color.get(name)! }))

  // Neighbours must be computed before force-graph replaces link ids with objects
  const neighbors = new Map(data.nodes.map((n) => [n.id, new Set<string>()]))
  for (const l of data.links) {
    neighbors.get(l.source)!.add(l.target)
    neighbors.get(l.target)!.add(l.source)
  }
  for (const n of data.nodes) n.deg = neighbors.get(n.id)!.size

  const idOf = (x: any) => (typeof x === 'object' ? x.id : x)
  const radius = (n: any) => 3 + Math.sqrt(n.deg ?? 0) * 1.8
  let focus: Set<string> | null = null

  function select(n: GNode | null) {
    selected.value = n?.id ?? null
    selectedName.value = n?.name ?? ''
    focus = n ? new Set([n.id, ...neighbors.get(n.id)!]) : null
    graph.refresh()
  }

  // First tap on a node focuses it, the second tap on the same node opens the note
  function activate(n: GNode | null) {
    if (!n) return select(null)
    if (selected.value === n.id) {
      const to = pathByStem.value.get(n.id)
      if (to) navigateTo(to)
      return
    }
    select(n)
  }

  // Touch and pen use the library's own tap handling; a mouse uses ours (below).
  let lastType = 'mouse'

  graph = new ForceGraph(el)
    .graphData(data)
    .width(el.clientWidth)
    .height(el.clientHeight)
    .backgroundColor('rgba(0,0,0,0)')
    .autoPauseRedraw(false)
    .warmupTicks(150) // lay out first, so nodes don't drift under the cursor
    .cooldownTime(1500)
    .onEngineStop(() => fit())
    .nodeCanvasObject((n: any, ctx: CanvasRenderingContext2D, scale: number) => {
      const dim = focus && !focus.has(n.id)
      ctx.globalAlpha = dim ? 0.15 : 1
      ctx.beginPath()
      ctx.arc(n.x, n.y, radius(n), 0, 2 * Math.PI)
      ctx.fillStyle = color.get(n.group)!
      ctx.fill()
      if (n.id === selected.value) {
        ctx.lineWidth = 1.5 / scale
        ctx.strokeStyle = text
        ctx.stroke()
      }
      if (!dim && (scale > 1.6 || focus)) {
        ctx.font = `${11 / scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = text
        ctx.fillText(n.name, n.x, n.y + radius(n) + 2 / scale)
      }
      ctx.globalAlpha = 1
    })
    // Tap area of at least ~14px on screen, whatever the zoom
    .nodePointerAreaPaint((n: any, c: string, ctx: CanvasRenderingContext2D, scale: number) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(n.x, n.y, Math.max(radius(n) + 4, 14 / scale), 0, 2 * Math.PI)
      ctx.fill()
    })
    .linkColor((l: any) =>
      !selected.value || idOf(l.source) === selected.value || idOf(l.target) === selected.value
        ? edge
        : faint,
    )
    .onNodeClick((n: any) => {
      if (lastType === 'mouse') return // mouse clicks are handled below
      activate(n)
    })
    .onBackgroundClick(() => {
      if (lastType === 'mouse') return
      activate(null)
    })

  // Keep the canvas size in sync with its box (no re-fit here, so your zoom stays put)
  ro = new ResizeObserver(() => {
    graph.width(el.clientWidth).height(el.clientHeight)
  })
  ro.observe(el)

  // The legend and safe-area padding change the box size just after mount,
  // so fit a few times while the layout settles
  for (const t of [200, 800, 1800]) setTimeout(() => fit(0), t)

  // ---- Mouse only: our own hit-testing, the nearest node within ~14px of the pointer ----
  function nodeAt(clientX: number, clientY: number): any | null {
    const canvas = el.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    // also correct for a scaled ancestor, if there ever is one
    const x = (clientX - rect.left) * (rect.width ? canvas.clientWidth / rect.width : 1)
    const y = (clientY - rect.top) * (rect.height ? canvas.clientHeight / rect.height : 1)
    const p = graph.screen2GraphCoords(x, y)
    const slop = 14 / graph.zoom()

    let best: any = null
    let bestDist = Infinity
    for (const n of graph.graphData().nodes as any[]) {
      if (n.x == null) continue
      const d = Math.hypot(n.x - p.x, n.y - p.y)
      if (d <= Math.max(radius(n) + 4, slop) && d < bestDist) {
        best = n
        bestDist = d
      }
    }
    return best
  }

  let tap: { x: number; y: number; id: number } | null = null

  const onDown = (e: PointerEvent) => {
    lastType = e.pointerType
    userMoved = true // the user is interacting, so stop auto-fitting
    if (e.pointerType !== 'mouse') return
    tap = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const t = tap
    tap = null
    if (!t || e.pointerId !== t.id) return
    // only a real click counts, not the end of a pan
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 6) return
    if (!el.contains(e.target as Node)) return
    activate(nodeAt(e.clientX, e.clientY))
  }

  const onCancel = () => {
    tap = null
  }

  // Mouse hover: pointer cursor + a native tooltip with the note name
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.buttons) return
    const n = nodeAt(e.clientX, e.clientY)
    el.style.cursor = n ? 'pointer' : 'default'
    el.title = n ? n.name : ''
  }

  const onWheel = () => {
    userMoved = true
  }

  el.addEventListener('pointerdown', onDown, { passive: true })
  el.addEventListener('pointermove', onMove, { passive: true })
  el.addEventListener('wheel', onWheel, { passive: true })
  // up/cancel on window, so releasing outside the box can't leave a click "stuck"
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('pointercancel', onCancel, { passive: true })

  cleanup = () => {
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('wheel', onWheel)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
  }
})

onBeforeUnmount(() => {
  cleanup?.()
  ro?.disconnect()
  graph?._destructor?.()
  graph = null
})
</script>

<template>
  <main class="mx-auto w-full max-w-6xl px-3 md:px-6">
    <!-- One block that is either a normal card or a full-screen overlay -->
    <div
      ref="shell"
      :class="
        full
          ? 'fixed inset-0 z-50 isolate flex flex-col gap-3 overscroll-contain touch-none bg-stone-50 px-3 pt-[calc(0.75rem_+_env(safe-area-inset-top,0px))] pb-[calc(0.75rem_+_env(safe-area-inset-bottom,0px))] text-stone-900 dark:bg-stone-900 dark:text-gray-100'
          : 'card my-4 space-y-3 lg:my-6'
      "
    >
      <!-- Same soft background as the rest of the site, only in full screen -->
      <img
        v-if="full"
        src="/blob-bg.svg"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-top-left opacity-60"
      />

      <!-- Legend + buttons -->
      <div class="flex items-start gap-2">
        <div class="flex flex-1 flex-wrap gap-2">
          <span
            v-for="g in groups"
            :key="g.name"
            class="flex items-center gap-1.5 rounded-full border border-purple-300/30 px-3 py-1 text-sm"
          >
            <span class="size-2.5 rounded-full" :style="{ background: g.color }" />
            {{ g.name }}
          </span>
        </div>

        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-full border border-purple-300/30 p-2 text-lg transition-colors hover:bg-purple-500/20"
          aria-label="Căn giữa đồ thị"
          @click="refit"
        >
          <span class="i-solar:target-linear block" />
        </button>

        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-full border border-purple-300/30 p-2 text-lg transition-colors hover:bg-purple-500/20"
          :aria-label="full ? 'Thoát toàn màn hình' : 'Toàn màn hình'"
          @click="setFull(!full)"
        >
          <span
            :class="full ? 'i-solar:close-circle-line-duotone' : 'i-solar:full-screen-linear'"
            class="block"
          />
        </button>
      </div>

      <!-- Graph -->
      <div
        ref="container"
        :class="full ? 'min-h-0 flex-1' : 'h-[65dvh]'"
        class="w-full overflow-hidden rounded-lg border border-purple-300/20 bg-purple-950/20"
      />

      <!-- Selected node (fixed height, so selecting never resizes the graph) -->
      <p class="h-10 overflow-hidden text-sm opacity-70 line-clamp-2">
        {{
          selectedName
            ? `${selectedName} · chạm lần nữa để mở`
            : 'Chạm vào một nút để xem liên kết, chạm lần nữa để mở ghi chú.'
        }}
      </p>
    </div>
  </main>
</template>
