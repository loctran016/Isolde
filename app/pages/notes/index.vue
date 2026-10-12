<script setup lang="ts">
import type { NavigationItem } from 'comark-content'
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from 'reka-ui'
import noteSubject from '~/data/noteSubject.js'
const island = getIsland('/notes')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

const { data: nav } = await useAsyncData('notes-nav', () => clientContent.navigation())

const itemsPerPage = 12
const currentPage = ref(1)
const selectedSubject = ref('all')
const search = ref('')

const [listRef] = useAutoAnimate({ duration: 200 })

function label(item: NavigationItem, depth?: number) {
  const parts = item.stem?.split('/') ?? []
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

const allPages = computed(() =>
  (nav.value?.[0]?.children ?? []).flatMap(folder =>
    (folder.children ?? []).flatMap(subfolder =>
      (subfolder.children ?? []).map(page => ({
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
  for (const p of allPages.value)
    counts.set(p.subject, (counts.get(p.subject) ?? 0) + 1)
  return [...counts].map(([name, count]) => ({ name, count }))
})

const filteredPages = computed(() => {
  const q = normalize(search.value)
  return allPages.value.filter(p =>
    (selectedSubject.value === 'all' || p.subject === selectedSubject.value)
    && (!q || p.searchKey.includes(q)),
  )
})

const pagedPages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredPages.value.slice(start, start + itemsPerPage)
})

watch([selectedSubject, search], () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="i-healthicons:gastroenterology hidden"></div>
  <div class="i-healthicons:medicines-24px hidden"></div>
  <main class="mx-auto w-full max-w-6xl px-3 md:px-6">
    <div class="my-4 lg:my-6 space-y-4 card">
      <!-- Search -->
      <div class="relative">
        <input
          v-model="search"
          type="search"
          inputmode="search"
          autocomplete="off"
          placeholder="Tìm ghi chú…"
          aria-label="Tìm ghi chú"
          class="w-full rounded-lg border border-purple-300/30 bg-purple-50/25 dark:bg-purple-950/40 px-4 py-2 pr-10 text-sm outline-none transition-colors placeholder:opacity-60 focus:border-purple-400 [&::-webkit-search-cancel-button]:hidden"
        >
        <button
          v-if="search"
          type="button"
          aria-label="Xoá tìm kiếm"
          class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm opacity-60 hover:opacity-100"
          @click="search = ''"
        >
          ✕
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="px-3 py-1 rounded-full text-sm border transition-colors"
          :class="selectedSubject === 'all'
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'border-purple-300/30 hover:bg-purple-500/20'"
          @click="selectedSubject = 'all'"
        >
          Tất cả
          <span class="opacity-70 ml-1">{{ allPages.length }}</span>
        </button>
        <button
          v-for="s in subjects"
          :key="s.name"
          type="button"
          class="px-3 py-1 rounded-full text-sm border transition-colors"
          :class="selectedSubject === s.name
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'border-purple-300/30 hover:bg-purple-500/20'"
          @click="selectedSubject = s.name"
        >
          {{ s.name }}
          <span class="opacity-70 ml-1">{{ s.count }}</span>
        </button>
      </div>

      <!-- Cards -->
      <ul ref="listRef" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch w-full gap-3">
        <li
          v-for="{ page, subject, topic, icon } in pagedPages"
          :key="page.path"
          class="group rounded-lg border border-purple-300/20 bg-purple-50/25 dark:bg-purple-950/40 hover:border-purple-300/50 hover:bg-purple-50/40 dark:hover:bg-purple-900/40 transition-colors duration-200"
        >
          <NuxtLink :to="page.path" class="flex flex-col gap-3 h-full p-4 md:min-h-32">
            <!-- Eyebrow: subject · topic -->
            <div class="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300 font-head">
              <span :class="icon" class="text-lg shrink-0"></span>
              <span class="truncate">
                {{ subject }}
                <span class="opacity-50 mx-0.5">·</span>
                <span class="font-bold">{{ topic }}</span>
              </span>
            </div>

            <!-- Title -->
            <h3 class="text-sm md:text-base font-bold leading-snug group-hover:underline underline-offset-4 decoration-purple-400/60">
              {{ label(page) }}
            </h3>
          </NuxtLink>
        </li>
      </ul>

      <p v-if="!filteredPages.length" class="text-center opacity-60 py-8">
        {{ search ? `Không tìm thấy ghi chú nào cho “${search}”.` : 'Chưa có ghi chú nào.' }}
      </p>

      <!-- Pagination -->
      <PaginationRoot
        v-if="filteredPages.length > itemsPerPage"
        v-model:page="currentPage"
        :total="filteredPages.length"
        :items-per-page="itemsPerPage"
        :sibling-count="1"
        show-edges
        class="mt-4"
      >
        <PaginationList v-slot="{ items }" class="flex items-center justify-center gap-1">
          <PaginationFirst class="px-2 py-1 rounded disabled:opacity-40">«</PaginationFirst>
          <PaginationPrev class="px-2 py-1 rounded disabled:opacity-40">‹</PaginationPrev>
          <template v-for="(p, index) in items">
            <PaginationListItem
              v-if="p.type === 'page'"
              :key="index"
              :value="p.value"
              class="px-3 py-1 rounded data-[selected]:bg-purple-600 data-[selected]:text-white"
            >
              {{ p.value }}
            </PaginationListItem>
            <PaginationEllipsis v-else :key="p.type + index" :index="index">&#8230;</PaginationEllipsis>
          </template>
          <PaginationNext class="px-2 py-1 rounded disabled:opacity-40">›</PaginationNext>
          <PaginationLast class="px-2 py-1 rounded disabled:opacity-40">»</PaginationLast>
        </PaginationList>
      </PaginationRoot>
    </div>
  </main>
</template>
