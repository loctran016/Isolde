<script setup lang="ts">
const { $pwa } = useNuxtApp()
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) ?? '')

useHead({
  bodyAttrs: {
    class:
      'xl:scrollbar scrollbar-w-1.5 scrollbar-radius-full scrollbar-track-color-transparent scrollbar-thumb-color-black/20 hover:scrollbar-thumb-color-black/40 dark:scrollbar-thumb-color-white/20 dark:hover:scrollbar-thumb-color-white/40',
  },
  htmlAttrs: {
    class:
      'xl:scrollbar scrollbar-w-1.5 scrollbar-radius-full scrollbar-track-color-transparent scrollbar-thumb-color-black/20 hover:scrollbar-thumb-color-black/40 dark:scrollbar-thumb-color-white/20 dark:hover:scrollbar-thumb-color-white/40',
  },
})
// useHead({
//   bodyAttrs: {
//     class: 'scrollbar-thin-all',
//   },
//   htmlAttrs: {
//     class: 'scrollbar-thin-all',
//   },
// })
</script>

<template>
  <div
    class="w-full bg-stone-50 text-stone-900 dark:bg-stone-900 dark:text-gray-100 scrollbar scrollbar-track-op-0 scrollbar-thin font-sans min-h-screen grid items-start"
  >
    <img
      src="/blob-bg.svg"
      alt=""
      aria-hidden="true"
      class="fixed inset-0 w-full h-full object-cover object-top-left z-0 opacity-60 dark:opacity-60 pointer-events-none"
    />

    <header
      class="sticky top-0 z-20 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/30 backdrop-blur-xl backdrop-saturate-150"
    >
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-2">
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
