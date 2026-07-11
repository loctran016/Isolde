<script setup lang="ts">
const { $pwa } = useNuxtApp()
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) ?? '')
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

useHead({
  htmlAttrs: {
    class: 'scrollbar-none',
  },
})
</script>

<template>
  <div
    class="w-full bg-stone-50 text-stone-900 dark:bg-stone-900 dark:text-gray-100 font-sans h-screen flex flex-col overflow-hidden"
  >
    <img
      src="/blob-bg.svg"
      alt=""
      aria-hidden="true"
      class="fixed inset-0 w-full h-full object-cover object-top-left z-0 opacity-60 dark:opacity-60 pointer-events-none"
    />

    <ScrollAreaRoot style="--scrollbar-size: 18px" class="flex-1 min-h-0">
      <ScrollAreaViewport class="w-full h-full">
        <header
          class="sticky top-0 z-20 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/30 backdrop-blur-xl backdrop-saturate-150 shrink-0"
        >
          <div class="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-2">
            <span class="text-xl font-medium font-head truncate">{{ pageTitle }}</span>
            <NavBar />
          </div>
        </header>
        <main class="mx-auto px-4 max-w-9/10 lg:max-w-5/6 w-full min-h-screen self-stretch">
          <slot />
        </main>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar
        class="flex select-none touch-none p-0.5 z-20 transition-colors duration-[160ms] ease-out data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
        orientation="vertical"
      >
        <ScrollAreaThumb
          class="flex-1 bg-purple-500/40 hover:bg-purple-500/70 dark:bg-purple-400/30 dark:hover:bg-purple-400/60 rounded-full relative before:content-empty before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-44px before:min-h-44px"
        />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>

    <NuxtPwaAssets />
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

.img-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.015; /* Controls the intensity (1.5% opacity) */
  pointer-events: none; /* Allows clicks to pass through to widgets */

  /* High-quality SVG noise texture */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
