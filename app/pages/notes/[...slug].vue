<script setup lang="ts">
import { MarkdownDocument } from '@comark/vue'

const route = useRoute()
const path = route.path.replace(/\/+$/, '') || '/'
const { data: page, error } = await useAsyncData(path, () => clientContent.get(path))
const island = getIsland('/notes')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({
  pageTransition: {
    name: 'focus-mode',
    mode: 'out-in',
  },
  layout: 'note',
  title: island.pageTitle,
  titleIcon: island.titleIcon,
})

if (error.value) {
  console.error('Content fetch error:', error.value)
}

if (!page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}

const pageTitles = page.value.meta.stem.split('/') || ['Y Đa Khoa']

// Prepend the title as an H1 node directly on the parsed document
if (page.value && Array.isArray(page.value.nodes)) {
  const hasH1 = page.value.nodes.some((node) => Array.isArray(node) && node[0] === 'h1')
  if (!hasH1) {
    page.value.nodes.unshift(['h1', {}, pageTitles.pop()])
  }
}
</script>

<template>
  <div
    class="max-w-9/10 lg:max-w-3/5 mt-6 lg:mt-8 prose prose-slate lg:prose-lg dark:prose-invert prose-headings:font-head mx-auto !max-w-75ch prose-a:no-underline hover:prose-a:text-purple-800/95 dark:hover:prose-a:text-purple-300/90 prose-a:transition-all prose-a:duration-200"
  >
    <NuxtLink class="mb-4 cursor-pointer flex gap-2 opacity-90" to="/notes">
      <div class="i-solar:home-2-bold lg:text-lg" />
      <span class="text-xs lg:text-sm">
        {{ pageTitles[0] }} /
        <span class="opacity-90">
          {{ pageTitles[1] }}
        </span>
      </span>
    </NuxtLink>
    <MarkdownDocument :value="page" class=""></MarkdownDocument>
  </div>
</template>

<style>
.focus-mode-enter-active,
.focus-mode-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.focus-mode-enter-from,
.focus-mode-leave-to {
  opacity: 0;
}
</style>
