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

definePageMeta({ pageTransition: {
    name: 'focus-mode',
    mode: 'out-in'
  },layout: 'note',title: island.pageTitle, titleIcon: island.titleIcon })

if (error.value) {
  console.error('Content fetch error:', error.value)
}

if (!page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}

// Derive a human-readable title from the filename/route path
// e.g. "/blog/my-first-post" -> "My First Post"
const filename = path.split('/').filter(Boolean).pop() ?? 'index'
const title = filename
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (c) => c.toUpperCase())

// Prepend the title as an H1 node directly on the parsed document
if (page.value && Array.isArray(page.value.nodes)) {
  const hasH1 = page.value.nodes.some(
    (node) => Array.isArray(node) && node[0] === 'h1'
  )
  if (!hasH1) {
    page.value.nodes.unshift(['h1', {}, title])
  }
}

</script>

<template>
  <div class="card mt-6">
    <MarkdownDocument :value="page" class="prose lg:prose-xl dark:prose-invert prose-headings:font-head mx-auto" />
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