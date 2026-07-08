<template>
  <NuxtLoadingIndicator color="#ec4899" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// const useTheme = useTheme()
const { themePref, applyTheme } = useTheme()

watch(themePref, applyTheme)

let cleanup: (() => void) | null = null

onMounted(() => {
  applyTheme()
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (themePref.value === 'system') applyTheme()
  }
  mq.addEventListener('change', handler)
  cleanup = () => mq.removeEventListener('change', handler)
})

onBeforeUnmount(() => cleanup?.())
</script>
