<script setup lang="ts">
defineProps<{ links: { id: string; text: string; children?: any[] }[] }>()
</script>

<template>
  <ul class="space-y-1 ml-3 md:ml-6">
    <li v-for="link in links" :key="link.id" class="">
      <a :href="`#${link.id}`" class="opacity-70 hover:opacity-100 hover:text-purple-800/95 dark:hover:text-purple-300/90 transition-all ease-in-out duration-200">
        {{ link.text }}
      </a>
      <TocLinks v-if="link.children?.length" :links="link.children" class="ml-2 mt-1 mb-3 text-base" />
    </li>
  </ul>
</template>
