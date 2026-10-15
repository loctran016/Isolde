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

const PALETTE = ['#c084fc', '#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#a3e635', '#22d3ee']

const container = ref<HTMLDivElement>()
const groups = ref<{ name: string; color: string }[]>([])
const selected = ref<string | null>(null)
const selectedName = ref('')
let graph: any
let ro: ResizeObserver | undefined

onMounted(async () => {
  const [{ default: ForceGraph }, data] = await Promise.all([
    import('force-graph'),
    $fetch<{ nodes: GNode[]; links: GLink[] }>('/graph.json'),
  ])
  const el = container.value!

  const dark = matchMedia('(prefers-color-scheme: dark)').matches
    || document.documentElement.classList.contains('dark')
  const text = dark ? '#f5f3ff' : '#1c1917'
  const edge = dark ? 'rgba(216,180,254,0.35)' : 'rgba(88,28,135,0.35)'
  const faint = dark ? 'rgba(216,180,254,0.08)' : 'rgba(88,28,135,0.08)'

  const names = [...new Set(data.nodes.map(n => n.group))].sort()
  const color = new Map(names.map((n, i) => [n, PALETTE[i % PALETTE.length]]))
  groups.value = names.map(name => ({ name, color: color.get(name)! }))

  // Neighbours must be computed before force-graph replaces link ids with objects
  const neighbors = new Map(data.nodes.map(n => [n.id, new Set<string>()]))
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

  graph = new ForceGraph(el)
    .graphData(data)
    .width(el.clientWidth)
    .height(el.clientHeight)
    .backgroundColor('rgba(0,0,0,0)')
    .cooldownTime(4000)
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
    // Bigger hit area so nodes are easy to tap on a phone
    .nodePointerAreaPaint((n: any, c: string, ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(n.x, n.y, radius(n) + 5, 0, 2 * Math.PI)
      ctx.fill()
    })
    .linkColor((l: any) =>
      !selected.value || idOf(l.source) === selected.value || idOf(l.target) === selected.value
        ? edge
        : faint,
    )
    .onNodeClick((n: any) => {
      if (selected.value === n.id) {
        const to = pathByStem.value.get(n.id)
        if (to) navigateTo(to)
        return
      }
      select(n)
    })
    .onBackgroundClick(() => select(null))

  ro = new ResizeObserver(() => graph.width(el.clientWidth).height(el.clientHeight))
  ro.observe(el)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  graph?._destructor?.()
})
</script>

<template>
  <main class="mx-auto w-full max-w-6xl px-3 md:px-6">
    <div class="my-4 lg:my-6 space-y-3 card">
      <div class="flex flex-wrap gap-2">
        <span
          v-for="g in groups"
          :key="g.name"
          class="flex items-center gap-1.5 rounded-full border border-purple-300/30 px-3 py-1 text-sm"
        >
          <span class="size-2.5 rounded-full" :style="{ background: g.color }" />
          {{ g.name }}
        </span>
      </div>

      <div
        ref="container"
        class="h-[65dvh] w-full overflow-hidden rounded-lg border border-purple-300/20 bg-purple-950/20"
      />

      <p class="min-h-5 text-sm opacity-70">
        {{ selectedName ? `${selectedName} · chạm lần nữa để mở` : 'Chạm vào một nút để xem liên kết, chạm lần nữa để mở ghi chú.' }}
      </p>
    </div>
  </main>
</template>
