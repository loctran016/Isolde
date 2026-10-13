<script setup lang="ts">
type Link = { id: string; text: string; children?: Link[] }

withDefaults(defineProps<{ links: Link[]; depth?: number; prefix?: string }>(), {
  depth: 0,
  prefix: '',
})
</script>

<template>
  <ul
    :class="depth === 0
      ? 'space-y-0.5'
      : 'mt-0.5 mb-2 ml-2 space-y-0.5 border-l border-slate-500/30 pl-3'"
  >
    <li v-for="(link, i) in links" :key="link.id">
      <a
        :href="`#${link.id}`"
        class="flex gap-2 rounded py-1 transition-all duration-200 ease-in-out hover:text-purple-800/95 dark:hover:text-purple-300/90"
        :class="depth === 0
          ? 'font-medium opacity-90 hover:opacity-100'
          : 'text-sm opacity-70 hover:opacity-100'"
      >
        <span class="shrink-0 tabular-nums opacity-60">{{ prefix }}{{ i + 1 }}.</span>
        <span>{{ link.text }}</span>
      </a>
      <TocLinks
        v-if="link.children?.length"
        :links="link.children"
        :depth="depth + 1"
        :prefix="`${prefix}${i + 1}.`"
      />
    </li>
  </ul>
</template>
