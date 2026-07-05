<script setup lang="ts">
const { $pwa } = useNuxtApp()
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) ?? '')
</script>

<template>
  <div
    class="w-full bg-stone-50 text-stone-900 dark:bg-stone-900 dark:text-gray-100 scrollbar scrollbar-track-op-0 scrollbar-thin font-sans min-h-screen grid items-start"
  >
    <header
      class="sticky top-0 z-20 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/30 backdrop-blur-xl backdrop-saturate-150"
    >
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <span class="text-xl font-medium font-head truncate">{{ pageTitle }}</span>
        <NavBar />
      </div>
    </header>

    <main class="mx-auto px-4 max-w-9/10 lg:max-w-5/6 w-full self-stretch">
      <slot />
    </main>

    <NuxtPwaManifest />
  </div>
</template>

<style>
html,
body,
#__nuxt {
  width: 100%;
  height: 100%;
  margin: 0;
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
</style>
