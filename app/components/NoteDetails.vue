<script setup lang="ts">
defineProps<{
  summary?: string
  open?: boolean
}>()
</script>

<template>
  <details
    :open="open"
    class="not-prose-summary my-4 rounded-lg border border-purple-300/20 bg-purple-500/5 dark:bg-purple-950/30 px-4 py-2 [&[open]>summary_.chev]:rotate-90"
  >
    <summary
      class="flex cursor-pointer select-none list-none items-center gap-2 py-1 font-head font-bold [&::-webkit-details-marker]:hidden"
    >
      <span
        class="chev i-solar:alt-arrow-right-linear shrink-0 transition-transform duration-200"
      />
      <slot name="summary">{{ summary }}</slot>
    </summary>
    <div class="pt-2">
      <slot />
    </div>
  </details>
</template>
