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
</script>

<template>
  <div class="card prose dark:prose-invert mt-6">
    <MarkdownDocument :value="page" />
  </div>
</template>
