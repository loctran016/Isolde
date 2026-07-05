<template>
  <div class="grid">
    <ComboboxRoot v-model="selectedTune" class="relative mt-10">
      <ComboboxAnchor
        class="min-w-24 inline-flex items-center justify-between rounded-lg border border-stone-800/30 px-4 text-xs leading-none h-[35px] gap-[5px] bg-white/50 hover:bg-stone-50/50 transition-all duration-200 shadow-sm focus:shadow-[0_0_0_2px] focus:shadow-black outline-none"
      >
        <ComboboxInput
          class="!bg-transparent outline-none h-full placeholder-stone-400 text-sm"
          placeholder="Search a tune..."
          :display-value="(tune) => tune?.title ?? ''"
        />
        <ComboboxTrigger>
          <div
            class="i-tabler:chevron-down h-4 w-4 rotate-180 transition-all duration-200 hover:rotate-0 cursor-pointer"
          />
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxContent
        class="absolute z-10 w-full max-w-62 mt-1 min-w-24 bg-white overflow-hidden rounded-lg shadow-sm border border-stone-800/40 will-change-[opacity,transform]"
      >
        <ComboboxViewport class="p-[5px]">
          <ComboboxEmpty class="text-xs font-medium text-center py-2 text-stone-400" />

          <ComboboxItem
            v-for="tune in tuneList"
            :key="tune.path"
            :value="tune"
            :textValue="tune.title"
            class="text-sm leading-none rounded-[3px] flex items-center h-[25px] px-8 select-none data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-stone-100"
          >
            <ComboboxItemIndicator
              class="absolute left-0 w-10 inline-flex items-center justify-center"
            >
              <div class="i-tabler:check" />
            </ComboboxItemIndicator>
            <span>{{ tune.title }}</span>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxRoot>

    <div class="w-3/4 mx-auto mt-8">
      <ClientOnly>
        <ABCRenderer v-if="tuneAbc" :abcNotation="tuneAbc" />
        <template #fallback>
          <div class="text-sm text-stone-400">Loading notation...</div>
        </template>
      </ClientOnly>
    </div>
  </div>
  <div class="fixed bottom-4 right-4">
    <MetronomeButton />
  </div>
</template>

<script setup lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'

type Tune = {
  path: string
  title: string
}

// app/pages/musical.vue
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

const selectedTune = ref<Tune | null>(tuneList[0] ?? null)
const tuneAbc = ref<string | null>(null)
const tuneCache = new Map<string, string>()
let loadId = 0 // increment on each load to discard stale results

async function loadTune(path: string) {
  if (!path) return
  const id = ++loadId

  const cached = tuneCache.get(path)
  if (cached) {
    tuneAbc.value = cached
    return
  }

  const mod = (await tuneModules[path]()) as { default: string }
  if (id !== loadId) return // stale, component may be gone
  tuneCache.set(path, mod.default)
  tuneAbc.value = mod.default
}

onBeforeUnmount(() => {
  loadId++ // invalidates any in-flight load
})

watch(
  selectedTune,
  (tune) => {
    if (tune) loadTune(tune.path)
  },
  { immediate: true },
)
</script>
