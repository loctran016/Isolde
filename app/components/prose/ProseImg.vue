<script setup lang="ts">
const props = defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
}>()

const raw = computed(() => props.src?.trim() || props.alt?.trim() || '')

const resolved = computed(() => {
  const raw = props.src?.trim() || props.alt?.trim() || ''
  if (!raw || /^(https?:)?\/\/|^data:/.test(raw)) return raw
  const name = decodeURIComponent(raw).split('/').pop()!
  return '/api/media/' + encodeURIComponent(name)
})

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
