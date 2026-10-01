<script setup lang="ts">
defineProps<{ links: { id: string; text: string; children?: any[] }[] }>()
</script>

<template>
  <ul class="space-y-1">
    <li v-for="link in links" :key="link.id">
      <a :href="`#${link.id}`" class="opacity-70 hover:opacity-100 transition-opacity">
        {{ link.text }}
      </a>
      <TocLinks v-if="link.children?.length" :links="link.children" class="ml-3 mt-1" />
    </li>
  </ul>
</template>
