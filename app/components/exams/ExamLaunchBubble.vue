<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <div class="fixed right-6 z-30 bottom-6">
    <button
      type="button"
      class="grid h-12 w-12 md:h-14 md:w-14 place-items-center rounded-full border border-purple-300/50 bg-white/80 text-purple-700 shadow-lg backdrop-blur-md transition hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 active:scale-95 dark:border-white/15 dark:bg-purple-800/90 dark:text-purple-200 dark:hover:bg-purple-700"
      aria-label="Mở màn hình luyện đề"
      @click="open = true"
    >
      <span class="i-solar:document-add-linear block text-xl" aria-hidden="true" />
    </button>

    <ClientOnly>
      <ExamCheckInDialog v-model:open="open" />
    </ClientOnly>
  </div>
</template>
