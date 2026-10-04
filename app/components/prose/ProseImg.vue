<script setup lang="ts">
const props = defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
}>()

console.log('ProseImg', { src: props.src, alt: props.alt, resolved: resolved.value })
</script>

<template>
  <NuxtImg
    :src="resolved"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    format="webp"
    sizes="sm:100vw lg:75ch"
  />
</template>
