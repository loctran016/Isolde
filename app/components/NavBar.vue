<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDark, useToggle, useLocalStorage } from '@vueuse/core'

const themePref = useLocalStorage<'light' | 'dark' | 'system'>('theme-preference', 'system')

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  disableTransition: false,
})

const toggleDark = useToggle(isDark)

const applyTheme = () => {
  if (themePref.value === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
    return
  }
  isDark.value = themePref.value === 'dark'
}

onMounted(() => {
  applyTheme()

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (themePref.value === 'system') applyTheme()
  }
  mq.addEventListener('change', handler)

  onBeforeUnmount(() => mq.removeEventListener('change', handler))
})

function cycleTheme() {
  if (themePref.value === 'system') themePref.value = 'dark'
  else if (themePref.value === 'dark') themePref.value = 'light'
  else themePref.value = 'system'
  applyTheme()
}

const iconClass = computed(() => {
  if (themePref.value === 'system') return 'i-tabler:device-laptop'
  if (themePref.value === 'dark') return 'i-mdi:weather-night'
  return 'i-mdi:white-balance-sunny'
})

const themeLabel = computed(() => {
  if (themePref.value === 'system') return 'Theme: system'
  if (themePref.value === 'dark') return 'Theme: dark'
  return 'Theme: light'
})

const buttonClass = computed(() => {
  if (themePref.value === 'system')
    return 'hover:text-pink-700 hover:bg-pink-400/40 dark:hover:text-pink-400 dark:hover:bg-pink-600/30'
  if (themePref.value === 'dark') {
    return 'hover:bg-stone-100/10 hover:text-white'
  }
  if (themePref.value === 'light') {
    return 'hover:bg-orange-100/50 hover:text-orange-400'
  }
  return ''
})

const navItems = [
  { to: '/', icon: 'i-mdi:home', label: 'Home' },
  { to: '/fitness-tracker', icon: 'i-mdi:weight-lifter', label: 'Fitness' },
  { to: '/musical', icon: 'i-mdi:music-clef-treble', label: 'Musical' },
  { to: '/gallery', icon: 'i-solar:gallery-round-bold', label: 'Gallery' },
]
</script>

<template>
  <ul
    class="flex gap-1 items-center justify-center rounded-full border border-white/40 dark:border-white/10 bg-white/20 dark:bg-stone-500/20 backdrop-blur-md p-1"
  >
    <li v-for="item in navItems" :key="item.to">
      <NuxtLink
        :to="item.to"
        :aria-label="item.label"
        :title="item.label"
        exact-active-class="bg-stone-800/10 dark:bg-stone-100/10"
        class="block rounded-full transition-colors"
      >
        <IconNavBarWrapper><div :class="item.icon" /></IconNavBarWrapper>
      </NuxtLink>
    </li>

    <ClientOnly>
      <li>
        <button
          class="cursor-pointer duration-200 rounded-full text-lg lg:text-xl p-3 flex items-center justify-center transition-all"
          :class="buttonClass"
          :aria-label="themeLabel"
          :title="themeLabel"
          @click="cycleTheme"
        >
          <div :class="iconClass" />
        </button>
      </li>
      <template #fallback>
        <li>
          <button
            class="rounded-full text-lg lg:text-xl p-3 flex items-center justify-center cursor-progress"
            disabled
            aria-label="Loading theme"
          >
            <div class="i-tabler:device-laptop" />
          </button>
        </li>
      </template>
    </ClientOnly>
  </ul>
</template>
