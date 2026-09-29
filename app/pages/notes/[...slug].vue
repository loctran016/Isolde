<script setup lang="ts">
import { MarkdownDocument } from '@comark/vue'

const route = useRoute()
const path = route.path.replace(/\/+$/, '') || '/'
const { data: page, error } = await useAsyncData(path, () => clientContent.get(path))

if (error.value) {
  console.error('Content fetch error:', error.value)
}

if (!page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}

definePageMeta({
  pageTransition: {
    name: 'focus-mode',
    mode: 'out-in'
  }
})

</script>

<template>
  <div class="card mt-6">
    <MarkdownDocument :value="page" class="prose lg:prose-xl dark:prose-invert prose-headings:font-head mx-auto" />
  </div>
</template>

<style>
/* The transition timing and easing */
.focus-mode-enter-active,
.focus-mode-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* The starting and ending states */
.focus-mode-enter-from,
.focus-mode-leave-to {
  opacity: 0;
  filter: blur(8px);
  background-color: #000000; 
}
</style>
