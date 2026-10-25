<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

type Hit = {
  id: string // page path + heading anchor, e.g. "/notes/.../note#heading"
  title?: string
  snippets?: { title?: string; content?: string }
}

const open = ref(false)
const query = ref('')
const hits = ref<Hit[]>([])
const active = ref(0)
const loading = ref(false)
const failed = ref('')
const inputEl = ref<HTMLInputElement>()
const landing = useSearchLanding()

// ---- Page labels for each hit ("Nội khoa / Hô hấp / Hen PQ") ----
const { data: nav } = useNotesNav()
const strip = (s: string) => s.replace(/^\d+\.(?=\D)\s*/, '')

const labelByPath = computed(() => {
  const m = new Map<string, string>()
  const walk = (items: NavigationItem[] = []) => {
    for (const i of items) {
      if (i.stem && i.page !== false) m.set(i.path, i.stem.split('/').map(strip).join(' / '))
      walk(i.children)
    }
  }
  walk(nav.value)
  return m
})
const pageLabel = (id: string) => labelByPath.value.get(id.split('#')[0]) ?? id.split('#')[0]

// Snippets come back as HTML with <mark> tags. Escape everything except the marks.
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const renderSnippet = (html = '') =>
  html
    .split(/(<\/?mark>)/)
    .map((p) => (p === '<mark>' || p === '</mark>' ? p : escapeHtml(p)))
    .join('')

// ---- Search ----
let seq = 0
async function run() {
  const q = query.value.trim()
  const mine = ++seq
  if (!q) {
    hits.value = []
    failed.value = ''
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await (clientContent as any).search(q, {
      limit: 20,
      snippet: { columns: ['content'], around: 12, tag: 'mark' },
    })
    if (mine !== seq) return // a newer search has started
    hits.value = Array.isArray(res) ? res : []
    active.value = 0
    failed.value = ''
  } catch (e: any) {
    if (mine !== seq) return
    console.error('[search]', e)
    failed.value = import.meta.dev
      ? `Lỗi: ${e?.data?.message ?? e?.message ?? e}`
      : 'Không tìm kiếm được. Thử lại sau.'
    hits.value = []
  } finally {
    if (mine === seq) loading.value = false
  }
}
const debouncedRun = useDebounceFn(run, 180)
watch(query, () => {
  loading.value = !!query.value.trim()
  debouncedRun()
})

// ---- Open / close ----
async function show() {
  open.value = true
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select()
}
function hide() {
  open.value = false
}
function go(hit: Hit) {
  // the note page reads this to scroll to the heading and highlight what was searched
  landing.value = {
    q: query.value.trim(),
    id: hit.id,
    title: hit.title, // lets the page find the heading by its text if the anchor id differs
    tick: Date.now(),
  }
  hide()
  navigateTo(hit.id)
}


// Ctrl/Cmd + F opens the search (this replaces the browser's own find on this site)
onKeyStroke(['f', 'F'], (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return
  e.preventDefault()
  if (open.value) inputEl.value?.focus()
  else show()
})

function move(delta: number) {
  if (!hits.value.length) return
  active.value = (active.value + delta + hits.value.length) % hits.value.length
  nextTick(() =>
    document.querySelector('[data-search-active="true"]')?.scrollIntoView({ block: 'nearest' }),
  )
}
function enter() {
  const hit = hits.value[active.value]
  if (hit) go(hit)
}
</script>

<template>
  <ClientOnly>
    <!-- Floating button -->
    <button
      type="button"
      class="fixed right-4 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full border border-purple-300/40 bg-purple-600 text-xl text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      style="bottom: calc(1rem + env(safe-area-inset-bottom, 0px))"
      aria-label="Tìm kiếm ghi chú"
      title="Tìm kiếm (Ctrl/⌘ + F)"
      @click="show"
    >
      <span class="i-solar:magnifer-linear block" />
    </button>

    <Teleport to="body">
      <!-- Phones: near the top (the keyboard covers the bottom). md and up: centered on screen. -->
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] backdrop-blur-sm md:items-center md:pt-0"
        @click.self="hide"
        @keydown.esc="hide"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="enter"
      >
        <div
          class="flex max-h-[75dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-purple-300/30 bg-stone-50/95 text-stone-900 shadow-2xl md:h-[min(70dvh,36rem)] dark:bg-stone-900/95 dark:text-gray-100"
        >
          <!-- Input -->
          <div class="relative border-b border-purple-300/20">
            <span
              class="i-solar:magnifer-linear pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-60"
            />
            <input
              ref="inputEl"
              v-model="query"
              type="search"
              inputmode="search"
              autocomplete="off"
              placeholder="Tìm trong nội dung ghi chú…"
              aria-label="Tìm trong nội dung ghi chú"
              class="w-full bg-transparent py-3.5 pl-11 pr-12 text-base outline-none placeholder:opacity-60 [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer px-2 py-1 opacity-60 hover:opacity-100"
              aria-label="Đóng tìm kiếm"
              @click="hide"
            >
              <span class="i-solar:close-circle-line-duotone block text-lg" />
            </button>
          </div>

          <!-- Results -->
          <ul class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <li v-for="(hit, i) in hits" :key="hit.id" :data-search-active="i === active">
              <NuxtLink
                :to="hit.id"
                class="block border-b border-purple-300/10 px-4 py-3 transition-colors"
                :class="i === active ? 'bg-purple-500/20' : 'hover:bg-purple-500/10'"
                @mouseenter="active = i"
                @click.prevent="go(hit)"
              >
                <div class="truncate text-xs opacity-60">{{ pageLabel(hit.id) }}</div>
                <div class="font-semibold leading-snug">{{ hit.title }}</div>
                <p
                  v-if="hit.snippets?.content"
                  class="search-snippet mt-1 line-clamp-2 text-sm opacity-80"
                  v-html="renderSnippet(hit.snippets.content)"
                />
              </NuxtLink>
            </li>

            <li v-if="failed" class="px-4 py-6 text-center text-sm text-red-400">{{ failed }}</li>
            <li
              v-else-if="loading && !hits.length"
              class="px-4 py-6 text-center text-sm opacity-60"
            >
              Đang tìm… (lần đầu sẽ lập chỉ mục)
            </li>
            <li
              v-else-if="query.trim() && !loading && !hits.length"
              class="px-4 py-6 text-center text-sm opacity-60"
            >
              Không có kết quả cho “{{ query.trim() }}”.
            </li>
            <li v-else-if="!query.trim()" class="px-4 py-6 text-center text-sm opacity-60">
              Gõ để tìm trong nội dung các ghi chú.
            </li>
          </ul>

          <!-- Keyboard hints (hidden on touch screens) -->
          <div
            class="hidden items-center gap-4 border-t border-purple-300/20 px-4 py-2 text-xs opacity-60 md:flex"
          >
            <span>↑↓ chọn</span>
            <span>Enter mở</span>
            <span>Esc đóng</span>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style>
.search-snippet mark {
  background: rgba(192, 132, 252, 0.35);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
