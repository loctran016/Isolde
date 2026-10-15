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
    class="w-full bg-orange-50 text-stone-900 dark:bg-slate-900 dark:text-slate-200 font-sans app-shell flex flex-col overflow-hidden"
  >
    <ScrollAreaRoot
      style="
        --scrollbar-size: 18px;
        --header-total: calc(var(--header-height) + env(safe-area-inset-top, 0px));
      "
      class="relative flex-1 min-h-0 [--header-height:4.1875rem]"
    >
      <ScrollAreaViewport class="w-full h-full">
        <header class="sticky top-0 z-20 border-b border-stone/40 dark:border-white/10">
          <!-- Status-bar strip: tinted, but no backdrop-filter -->
          <div class="h-[env(safe-area-inset-top)] bg-white/30 dark:bg-stone-700/30" />

          <!-- Header bar: the blur lives here, below the strip -->
          <div
            class="h-[var(--header-height)] flex items-center bg-white/30 dark:bg-stone-700/30 backdrop-blur-xl backdrop-saturate-150"
          >
            <div
              class="w-full md:max-w-95% lg:max-w-6xl mx-auto flex items-center justify-between gap-4 px-4"
            >
              <div
                class="text-lg lg:text-xl tracking-wide truncate flex gap-2 items-center justify-center h-full"
              >
                <span class="leading-none">{{ pageTitle }}</span>
              </div>

              <NavBar type="notes" />
            </div>
          </div>
        </header>

        <main class="mx-auto px-4 h-full w-full min-h-[calc(100dvh-var(--header-total))]">
          <slot />
        </main>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar
        style="top: var(--header-total)"
        class="absolute right-0 bottom-0 flex select-none touch-none p-0.5 z-20 transition-colors duration-[160ms] ease-out data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
        orientation="vertical"
      >
        <ScrollAreaThumb
          class="flex-1 bg-stone-500/40 hover:bg-stone-500/70 dark:bg-stone-400/30 dark:hover:bg-stone-400/60 rounded-full relative before:content-empty before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-44px before:min-h-44px"
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
  overflow: hidden;
  overscroll-behavior: none;
}

/* Browser tab: follow the visible area as toolbars show and hide */
.app-shell {
  position: fixed;
  inset: 0;
}

/* Installed app: 100vh is the full screen, including the home-indicator area */
@media (display-mode: standalone) {
  .app-shell {
    bottom: auto;
    height: 100vh;
  }
}

/* Safety net: if any gap ever shows, it matches the page instead of being white */
html {
  background-color: #fafaf9; /* stone-50; use #fff7ed (orange-50) in the note layout */
}
html.dark {
  background-color: #1c1917; /* stone-900; use #0f172a (slate-900) in the note layout */
}

</style>
