<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

const { data: nav } = await useAsyncData('notes-nav', () => clientContent.navigation())

console.log(JSON.stringify(nav.value, null, 2))
console.log(nav.value) // expand in browser devtools object inspector, not JSON.stringify
</script>

<template>
  <div v-for="group in nav[0]?.children" :key="group.path" class="card">
    <h2>{{ group.title }}</h2>
    <NavigationContentTree v-if="group.children" :items="group.children" />
  </div>
</template>
