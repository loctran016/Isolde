<script setup lang="ts">
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) ?? '')
const pageTitleIcon = computed(() => (route.meta.titleIcon as string) ?? '')
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

useHead({
  htmlAttrs: {
    class: 'scrollbar-none',
  },
})
</script>

<template>
  <div
    class="w-full bg-orange-50 text-stone-900 dark:bg-slate-900 dark:text-slate-200 font-sans h-screen flex flex-col overflow-hidden"
  >

    <ScrollAreaRoot
      style="--scrollbar-size: 18px"
      class="relative flex-1 min-h-0 [--header-height:3.5rem] lg:[--header-height:4.1875rem]"
    >
      <ScrollAreaViewport class="w-full h-full">
        <header
          class="sticky top-0 z-20 h-[var(--header-height)] flex items-center border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/30 backdrop-blur-xl backdrop-saturate-150"
        >
          <!-- TODO: pt-safe as iPhone has small pt-safe -->
          <div
            class="w-full md:max-w-95% lg:max-w-6xl mx-auto flex items-center justify-between gap-4 px-4"
          >
            <div
              class="text-lg lg:text-xl tracking-wide truncate flex gap-2 items-center justify-center h-full"
            >
              <span class="leading-none">{{ pageTitle }}</span>
            </div>

            <NavBar />
          </div>
        </header>

        <main
          class="mx-auto px-4 h-full w-full min-h-[calc(100vh-var(--header-height))]"
        >
          <slot />
        </main>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar
        style="top: var(--header-height)"
        class="absolute right-0 bottom-0 flex select-none touch-none p-0.5 z-20 transition-colors duration-[160ms] ease-out data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
        orientation="vertical"
      >
        <ScrollAreaThumb
          class="flex-1 bg-stone-500/40 hover:bg-stone-500/70 dark:bg-purple-400/30 dark:hover:bg-stone-400/60 rounded-full relative before:content-empty before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-44px before:min-h-44px"
        />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>

    <PwaToast />
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
</style>
