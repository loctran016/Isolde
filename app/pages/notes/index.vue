<script setup lang="ts">
import type { NavigationItem } from 'comark-content'
import noteSubject from '~/data/noteSubject.js'
const island = getIsland('/notes')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

const { data: nav } = await useAsyncData('notes-nav', () => clientContent.navigation())

console.log(nav.value)

function label(item: NavigationItem, depth?: number) {
  const parts = item.stem?.split('/') ?? []
  return depth === undefined ? parts.at(-1) : parts[depth]
}
</script>

<template>
  <div class="i-healthicons:gastroenterology hidden"></div>
  <div class="i-healthicons:medicines-24px hidden"></div>
  <main class="my-4 lg:my-6 space-y-3 lg:space-y-4">
    <div v-for="folder in nav?.[0]?.children" :key="folder.path" class="card">
      <h2 class="card-title text-lg lg:text-xl tracking-wide">
        <div :class="noteSubject[folder.title]"></div>
        {{ label(folder, 0) }}
      </h2>

      <ul class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch w-full gap-2 mt-4">
        <template v-for="subfolder in folder.children" :key="subfolder.path">
          <li
            v-for="page in subfolder.children"
            :key="page.path"
            class="duration-200 w-full border-rounded-md cursor-pointer p-4 group bg-purple-50/25 hover:bg-purple-50/35 border border-white/10 dark:bg-purple-950/25 dark:hover:bg-purple-950/35 dark:border-white/5 md:min-h-32 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <NuxtLink :to="page.path" class="flex flex-col h-full">
              <h3 class="text-sm md:text-base md:min-h-14 flex-grow font-bold max-w-4/5">{{ label(page) }}</h3>
              <div
                class="flex justify-between items-start mt-2 pt-2 border-t-1 border-stone-900/20 dark:border-white/15 border-dashed md:mt-auto"
              ></div>
              <p class="text-purple-600 flex-grow dark:text-purple-300 font-bold font-head">
                {{ label(subfolder, 1) }}
              </p></NuxtLink
            >
          </li>
        </template>
      </ul>
    </div>
  </main>
</template>
