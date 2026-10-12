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

const itemsPerPage = 16
const currentPage = ref(1)

const [listRef] = useAutoAnimate({ duration: 200 })

const allPages = computed(() =>
  (nav.value?.[0]?.children ?? []).flatMap(folder =>
    (folder.children ?? []).flatMap(subfolder =>
      (subfolder.children ?? []).map(page => ({ folder, subfolder, page })),
    ),
  ),
)

const pagedPages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return allPages.value.slice(start, start + itemsPerPage)
})

function label(item: NavigationItem, depth?: number) {
  const parts = item.stem?.split('/') ?? []
  return depth === undefined ? parts.at(-1) : parts[depth]
}
</script>

<template>
  <div class="i-healthicons:gastroenterology hidden"></div>
  <div class="i-healthicons:medicines-24px hidden"></div>
  <main clas="card grid md:grid-cols-4">
    <div class="my-4 lg:my-6 space-y-3 md:col-span-3 lg:space-y-4 card">
      <ul ref="listRef" class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch w-full gap-2">
        <li
          v-for="{ folder, subfolder, page } in pagedPages"
          :key="page.path"
          class="duration-200 w-full border-rounded-md cursor-pointer p-4 group bg-purple-50/25 hover:bg-purple-50/35 border border-white/10 dark:bg-purple-950/25 dark:hover:bg-purple-950/35 dark:border-white/5 md:min-h-32 cursor-pointer hover:opacity-90 transition-opacity relative"
        >
          <NuxtLink :to="page.path" class="flex flex-col h-full">
            <h3 class="text-sm md:text-base md:min-h-14 flex-grow font-bold max-w-9/10">{{ label(page) }}</h3>
            <div
              class="flex justify-between items-start mt-2 pt-2 border-t-1 border-stone-900/20 dark:border-white/15 border-dashed md:mt-auto"
            ></div>
            <div class="flex-grow ml-auto">
              <div :class="noteSubject[folder.title]" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 text-4xl"></div>
              {{ label(folder, 0) }}
              <p class="text-purple-600 flex-grow dark:text-purple-300 font-bold font-head">
                {{ label(subfolder, 1) }}
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <PaginationRoot
        v-if="allPages.length > itemsPerPage"
        v-model:page="currentPage"
        :total="allPages.length"
        :items-per-page="itemsPerPage"
        :sibling-count="1"
        show-edges
        class="mt-4"
      >
        <PaginationList v-slot="{ items }" class="flex items-center justify-center gap-1">
          <PaginationFirst class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer">«</PaginationFirst>
          <PaginationPrev class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer">‹</PaginationPrev>
          <template v-for="(p, index) in items">
            <PaginationListItem
              v-if="p.type === 'page'"
              :key="index"
              :value="p.value"
              class="px-3 py-1 rounded data-[selected]:bg-purple-600 data-[selected]:text-white cursor-pointer"
            >
              {{ p.value }}
            </PaginationListItem>
            <PaginationEllipsis v-else :key="p.type + index" :index="index">&#8230;</PaginationEllipsis>
          </template>
          <PaginationNext class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer">›</PaginationNext>
          <PaginationLast class="px-2 py-1 rounded disabled:opacity-40 cursor-pointer">»</PaginationLast>
        </PaginationList>
      </PaginationRoot>
    </div>
  </main>
</template>
