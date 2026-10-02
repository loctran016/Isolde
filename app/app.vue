<template>
  <NuxtLoadingIndicator color="#ec4899" />
  <NuxtLayout class="bg-orange-50 dark:bg-slate-900">
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// const useTheme = useTheme()
// import '@fontsource-variable/inter'
// import '@fontsource-variable/space-grotesk'

const { themePref, applyTheme } = useTheme()

watch(themePref, applyTheme)

let cleanup: (() => void) | null = null

onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (themePref.value === 'system') applyTheme()
  }
  mq.addEventListener('change', handler)
  cleanup = () => mq.removeEventListener('change', handler)
})

onBeforeUnmount(() => cleanup?.())
</script>

<style>
/* The transition timing and easing */
.layout-enter-active,
.layout-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* The starting and ending states */
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
  filter: blur(8px);
  /* background-color: #000000; */
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-head: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
}
.prose {
  --font-head: 'Merriweather', ui-sans-serif, system-ui, sans-serif;
}
</style>
