<script setup lang="ts">
import { getIsland } from '~/data/islands'
const island = getIsland('/notes')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })


import type { NavigationItem } from 'comark-content'

const { data: nav } = await useAsyncData('notes-nav', () => clientContent.navigation())
</script>

<template>
<main class="mt-6 lg:mt-10 space-y-4 lg:space-y-6">
  <div v-for="group in nav[0]?.children" :key="group.path" class="card">
    <h2 clasa="font-bold text-lg md:text-xl">{{ group.title }}</h2>
    <NavigationContentTree v-if="group.children" :items="group.children" />
  </div>
</main>
</template>
