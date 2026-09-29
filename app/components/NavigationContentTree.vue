<!-- components/NavigationContentTree.vue -->
<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

defineOptions({ name: 'NavigationContentTree' })

defineProps<{ items: NavigationItem[] }>()

function label(item: NavigationItem) {
  return item.title ?? item.stem?.split('/').pop() ?? item.path
}
</script>

<template>
  <ul class="ml-4">
    <li v-for="item in items" :key="item.path">
      <NuxtLink v-if="item.page !== false" :to="item.path">
        {{ label(item) }}
      </NuxtLink>
      <span v-else>{{ label(item) }}</span>

      <NavigationContentTree v-if="item.children" :items="item.children" />
    </li>
  </ul>
</template>
