<script setup lang="ts">
import type { NavigationItem } from 'comark-content'
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import {
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from 'reka-ui'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import noteSubject from '~/data/noteSubject.js'
const island = getIsland('/notes')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

const { data: nav } = await useNotesNav()

const breakpoints = useBreakpoints(breakpointsTailwind)
const isLg = breakpoints.greaterOrEqual('xl')

// 12 below lg (divides the 2- and 3-column grids), 24 from lg up (divides 3 and 4 columns)
const itemsPerPage = computed(() => (isLg.value ? 16 : 12))
const currentPage = ref(1)
const selectedSubject = ref('all')
const onlyTodo = ref(false)
const search = ref('')

const [listRef] = useAutoAnimate({ duration: 200 })

// "1.Tim mạch" -> "Tim mạch" (leaves "1.5 mg" and "1.2.x" alone)
function stripPrefix(s: string) {
  return s.replace(/^\d+\.(?=\D)\s*/, '')
}

function label(item: NavigationItem, depth?: number) {
  const parts = (item.stem?.split('/') ?? []).map(stripPrefix)
  return depth === undefined ? parts.at(-1) : parts[depth]
}

// Lowercase, strip Vietnamese diacritics (đ isn't decomposed by NFD, so map it by hand)
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/đ/g, 'd')
    .trim()
}

// ---- Todo pins (ordered by the time you pinned them, saved in the browser) ----
const PIN_KEY = 'notes-pinned'
const pinned = ref<string[]>([])
const pinsLoaded = ref(false)

onMounted(() => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]')
    if (Array.isArray(parsed)) pinned.value = parsed.filter((x) => typeof x === 'string')
  } catch {}
  pinsLoaded.value = true
})

watch(pinned, (value) => {
  if (!pinsLoaded.value) return
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify(value))
  } catch {}
})

const pinOrder = computed(() => new Map(pinned.value.map((path, i) => [path, i])))

function togglePin(path: string) {
  pinned.value = pinOrder.value.has(path)
    ? pinned.value.filter((p) => p !== path)
    : [...pinned.value, path]
}

const allPages = computed(() =>
  (nav.value?.[0]?.children ?? []).flatMap((folder) =>
    (folder.children ?? []).flatMap((subfolder) =>
      (subfolder.children ?? []).map((page) => ({
        folder,
        subfolder,
        page,
        subject: label(folder, 0) ?? '',
        topic: label(subfolder, 1) ?? '',
        icon: noteSubject[folder.title] ?? 'i-healthicons:medicines-24px',
        searchKey: normalize(label(page) ?? ''),
      })),
    ),
  ),
)

const subjects = computed(() => {
  const counts = new Map<string, number>()
  for (const p of allPages.value) counts.set(p.subject, (counts.get(p.subject) ?? 0) + 1)
  return [...counts].map(([name, count]) => ({ name, count }))
})

// Count only pins that still exist (a renamed or deleted note won't inflate it)
const todoCount = computed(
  () => allPages.value.filter((p) => pinOrder.value.has(p.page.path)).length,
)

const filteredPages = computed(() => {
  const q = normalize(search.value)
  const matches = allPages.value.filter(
    (p) =>
      (selectedSubject.value === 'all' || p.subject === selectedSubject.value) &&
      (!q || p.searchKey.includes(q)),
  )
  const order = pinOrder.value
  const pinnedFirst = matches
    .filter((p) => order.has(p.page.path))
    .sort((a, b) => (order.get(a.page.path) ?? 0) - (order.get(b.page.path) ?? 0))

  if (onlyTodo.value) return pinnedFirst
  return [...pinnedFirst, ...matches.filter((p) => !order.has(p.page.path))]
})

const pagedPages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredPages.value.slice(start, start + itemsPerPage.value)
})

watch([selectedSubject, search, onlyTodo], () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="i-healthicons:gastroenterology hidden"></div>
  <div class="i-healthicons:medicines-24px hidden"></div>
  <main class="mx-auto pb-4 w-full max-w-6xl px-3 md:px-6">
    <div class="my-4 lg:my-6 space-y-4 card">
      <!-- Search -->
      <div class="relative">
        <span
          class="i-solar:magnifer-linear absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
        />
        <input
          v-model="search"
          type="search"
          inputmode="search"
          autocomplete="off"
          placeholder="Tìm ghi chú…"
          aria-label="Tìm ghi chú"
          class="w-full rounded-lg border border-purple-300/30 bg-purple-50/25 dark:bg-purple-950/20 pl-9 pr-10 py-2 text-sm outline-none transition-colors placeholder:opacity-60 focus:border-purple-400 [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          v-if="search"
          type="button"
          aria-label="Xoá tìm kiếm"
          class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 opacity-60 hover:opacity-100 cursor-pointer transition-all duration-200"
          @click="search = ''"
        >
          <span class="i-solar:close-circle-line-duotone block" />
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer"
          :class="
            selectedSubject === 'all' && !onlyTodo
              ? 'bg-purple-600 border-purple-600 text-white'
              : 'border-purple-300/50 hover:bg-purple-500/20'
          "
          @click="
            () => {
              selectedSubject = 'all'
              onlyTodo = false
            }
          "
        >
          Tất cả
          <span class="opacity-70 ml-1">{{ allPages.length }}</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer"
          :class="
            onlyTodo
              ? 'bg-purple-600 border-purple-600 text-white'
              : 'border-purple-300/50 hover:bg-purple-500/20'
          "
          @click="onlyTodo = !onlyTodo"
        >
          <span class="i-solar:pin-bold" />
          Chưa ôn
          <span class="opacity-70 ml-0.5">{{ todoCount }}</span>
        </button>
        <button
          v-for="s in subjects"
          :key="s.name"
          type="button"
          class="px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer"
          :class="
            selectedSubject === s.name
              ? 'bg-purple-600 border-purple-600 text-white'
              : 'border-purple-300/50 hover:bg-purple-500/20'
          "
          @click="selectedSubject = s.name"
        >
          {{ s.name }}
          <span class="opacity-70 ml-1">{{ s.count }}</span>
        </button>
      </div>

      <!-- Cards -->
      <ul
        ref="listRef"
        class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch w-full gap-3"
      >
        <li
          v-for="{ page, subject, topic, icon } in pagedPages"
          :key="page.path"
          class="group relative rounded-lg border bg-purple-50/25 dark:bg-purple-950/40 hover:bg-purple-50/40 dark:hover:bg-purple-900/40 transition-colors duration-200"
          :class="
            pinOrder.has(page.path)
              ? 'border-purple-400/60'
              : 'border-purple-300/20 hover:border-purple-300/50'
          "
        >
          <NuxtLink :to="page.path" class="flex flex-col gap-3 h-full p-4">
            <!-- Eyebrow: subject · topic -->
            <div
              class="flex items-center gap-2 pr-12 text-xs text-purple-600 dark:text-purple-300 font-head"
            >
              <span :class="icon" class="text-lg shrink-0"></span>
              <span class="truncate">
                {{ subject }}
                <span class="opacity-50 mx-0.5">·</span>
                <span class="font-bold">{{ topic }}</span>
              </span>
            </div>

            <!-- Title -->
            <h3
              class="text-sm md:text-base font-bold leading-snug group-hover:underline underline-offset-4 decoration-purple-400/60"
            >
              {{ label(page) }}
            </h3>

            <!-- Description (only if the note has one) -->
            <p v-if="page.description" class="text-xs opacity-70 line-clamp-2">
              {{ page.description }}
            </p>

            <!-- Footer arrow -->
            <span
              class="i-solar:arrow-right-linear mt-auto ml-auto text-purple-600 dark:text-purple-300 opacity-50 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1"
            />
          </NuxtLink>

          <!-- Pin (a sibling of the link, so it never triggers navigation) -->
          <button
            type="button"
            class="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-opacity"
            :class="
              pinOrder.has(page.path)
                ? 'text-pink-600 dark:text-pink-300'
                : 'opacity-50 hover:opacity-100'
            "
            :aria-pressed="pinOrder.has(page.path)"
            :aria-label="pinOrder.has(page.path) ? 'Bỏ ghim' : 'Ghim để ôn'"
            @click="togglePin(page.path)"
          >
            <span v-if="pinOrder.has(page.path)" class="font-bold tabular-nums">
              {{ (pinOrder.get(page.path) ?? 0) + 1 }}
            </span>
            <span :class="pinOrder.has(page.path) ? 'i-solar:pin-bold' : 'i-solar:pin-linear'" />
          </button>
        </li>
      </ul>

      <p v-if="!filteredPages.length" class="text-center opacity-60 py-8">
        <template v-if="search"> Không tìm thấy ghi chú nào cho “{{ search }}”. </template>
        <template v-else-if="onlyTodo">
          Chưa ghim ghi chú nào. Bấm biểu tượng ghim trên thẻ để thêm vào danh sách ôn.
        </template>
        <template v-else> Chưa có ghi chú nào. </template>
      </p>

      <!-- Pagination -->
      <PaginationRoot
        v-if="filteredPages.length > itemsPerPage"
        v-model:page="currentPage"
        :total="filteredPages.length"
        :items-per-page="itemsPerPage"
        :sibling-count="1"
        show-edges
        class="mt-4 md:mt-6"
      >
        <PaginationList v-slot="{ items }" class="flex items-center justify-center gap-1">
          <PaginationFirst class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer"
            >«</PaginationFirst
          >
          <PaginationPrev class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer"
            >‹</PaginationPrev
          >
          <template v-for="(p, index) in items">
            <PaginationListItem
              v-if="p.type === 'page'"
              :key="index"
              :value="p.value"
              class="px-3 py-1 cursor-pointer rounded data-[selected]:bg-purple-600 data-[selected]:text-white"
            >
              {{ p.value }}
            </PaginationListItem>
            <PaginationEllipsis v-else :key="p.type + index" :index="index"
              >&#8230;</PaginationEllipsis
            >
          </template>
          <PaginationNext class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer"
            >›</PaginationNext
          >
          <PaginationLast class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer"
            >»</PaginationLast
          >
        </PaginationList>
      </PaginationRoot>
    </div>
  </main>
</template>
