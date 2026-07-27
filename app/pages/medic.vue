<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { getIsland } from '~/data/islands'
const island = getIsland('/medic')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })
</script>
