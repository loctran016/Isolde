<script setup lang="ts">
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from 'reka-ui'

const { $pwa } = useNuxtApp()

const showOfflineToast = ref(false)
const showUpdateToast = ref(false)
const isFirstInstall = ref(false)

let offlineTimer: ReturnType<typeof setTimeout> | null = null
let hasMounted = false

watch(
  () => $pwa?.offlineReady,
  (ready) => {
    if (!ready || !import.meta.client) return

    const alreadyInstalled = localStorage.getItem('pwa-installed')
    if (alreadyInstalled) return

    isFirstInstall.value = true
    showOfflineToast.value = true
    localStorage.setItem('pwa-installed', 'true')
    offlineTimer = setTimeout(() => (showOfflineToast.value = false), 4000)
  },
)

// Only surface the toast on a genuine false -> true transition that
// happens *after* mount. Ignore whatever needRefresh already equals
// the instant this component sets up — that's not a real, in-session
// update, it's just whatever stale/racy value $pwa started with.
watch(
  () => $pwa?.needRefresh,
  (isRefreshNeeded, previous) => {
    if (!hasMounted) return
    if (isRefreshNeeded && previous === false) {
      showUpdateToast.value = !isFirstInstall.value
    }
    if (!isRefreshNeeded) {
      showUpdateToast.value = false
    }
  },
)

onMounted(() => {
  nextTick(() => {
    hasMounted = true
  })
})

function dismissUpdate() {
  showUpdateToast.value = false
  $pwa?.cancelPrompt?.()
}

function reloadApp() {
  $pwa?.updateServiceWorker()
}

onUnmounted(() => {
  if (offlineTimer) clearTimeout(offlineTimer)
})
</script>

<template>
  <ClientOnly>
    <ToastProvider>
      <ToastRoot
        :open="showUpdateToast"
        class="flex items-center gap-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl px-4 py-3 text-sm shadow-lg"
        @update:open="(open) => !open && dismissUpdate()"
      >
        <div class="i-mdi:update text-lg text-purple-500" />
        <ToastTitle class="font-medium">Update available</ToastTitle>
        <ToastDescription class="text-xs opacity-50">Tap to refresh</ToastDescription>
        <ToastAction as-child @click="reloadApp">
          <button
            class="ml-auto rounded-lg bg-purple-500 px-3 py-1 text-xs font-medium text-white hover:bg-purple-600 transition-colors"
          >
            Reload
          </button>
        </ToastAction>
        <ToastClose as-child>
          <button class="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
            <div class="i-mdi:close text-base" />
          </button>
        </ToastClose>
      </ToastRoot>

      <ToastRoot
        :open="showOfflineToast"
        class="flex items-center gap-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-xl px-4 py-3 text-sm shadow-lg"
      >
        <div class="i-mdi:wifi-check text-lg text-green-500" />
        <ToastTitle class="font-medium">Ready to use offline</ToastTitle>
      </ToastRoot>

      <ToastViewport class="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
    </ToastProvider>
  </ClientOnly>
</template>
