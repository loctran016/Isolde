<script setup lang="ts">
type Tune = {
  path: string
  title: string
}

definePageMeta({ title: 'Sound Island' })

const tuneModules = import.meta.glob('~/assets/data/tunes/*.abc', { query: '?raw' })

const tuneList: Tune[] = Object.keys(tuneModules).map((path) => {
  const filename = path.split('/').pop() ?? ''
  const base = filename.replace(/\.abc$/i, '')
  const title = base
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('vi-VN') + word.slice(1))
    .join(' ')

  return { path, title }
})

const tuneTitles = tuneList.map((t) => t.title)
const selectedTuneTitle = ref<string | null>(tuneList[0]?.title ?? null)

const tuneAbc = ref<string | null>(null)
const tuneCache = new Map<string, string>()
let loadId = 0

async function loadTune(path: string) {
  if (!path) return
  const id = ++loadId

  const cached = tuneCache.get(path)
  if (cached) {
    tuneAbc.value = cached
    return
  }

  const mod = (await tuneModules[path]()) as { default: string }
  if (id !== loadId) return
  tuneCache.set(path, mod.default)
  tuneAbc.value = mod.default
}

onBeforeUnmount(() => {
  loadId++
})

watch(
  selectedTuneTitle,
  (title) => {
    const tune = tuneList.find((t) => t.title === title)
    if (tune) loadTune(tune.path)
  },
  { immediate: true },
)
</script>

<template>
  <div class="grid mt-10">
    <ClientOnly>
      <Select v-model="selectedTuneTitle" :options="tuneTitles" class="mt-10 max-w-36" />
      <template #fallback>
        <div
          class="mt-10 h-9 w-40 rounded-xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/10 animate-pulse"
        />
      </template>
    </ClientOnly>

    <div class="w-8/9 mx-auto mt-8 card">
      <ClientOnly>
        <ABCRenderer v-if="tuneAbc" :abcNotation="tuneAbc" />
        <template #fallback>
          <div class="text-sm text-stone-400">Loading notation...</div>
        </template>
      </ClientOnly>
    </div>

    <div class="fixed bottom-4 right-4">
      <MetronomeButton />
    </div>
  </div>
</template>
