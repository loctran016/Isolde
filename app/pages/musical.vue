<!-- <template>
  <main class="p-8">
    <div class="w-3/4 mx-auto mt-10">
        <ABCRenderer :abcNotation="tune" />
    </div>
  </main>
</template>

<script setup>
const tune = `
X:1
T:Nụ Cười 18 20
%%score 1 2
L:1/8
Q:1/4=115
M:4/4
K:C
%%stretchlast true
V:1 treble nm="     " snm="   "
%%MIDI program 0
V:2 bass nm="     " snm="   "
%%MIDI program 0
V:1
 z4 ED E2 | E4 DE G2 | G4 ED E2 | E4 EE G2 |
 G4 EG GG | A2 G A2 G2 G | GG A C4 A, | F2 FF GD CD- |
 D7/2 z/ C2 D2 | E4 G2 GG | D4 E2 GA | c3 c d2 cA |
 G4 EE GA | c2 c c2 c cd | e3 c2 z cc | c2 c A2 G2 d- |
 d15/2 z/ | z4 ed cd | e2 ee c2 G2 | d3 c de d2 |
 c2 cc cc cd | G4 GA G2 | A4 Ac A2 | G4 E E2 D |
 E2 c c2 G2 d- | d7/2 z/ ed cd | e2 ee c2 G2 | d4 ed cd |
 c2 cc cc cd | G4 AG AB | c2 c c2 c2 g- | gg a2 c3 G |
 g2 g a2 e2 d- | d2 ec c2 d2 | c4- c3/2 z/ E2 | (24:23:2C8 z/ |]
V:2
 z8 | C,2 G,2 C4 | G,,2 D,2 G,4 | A,,2 E,2 A,4 |
 G,2 _B,2 C,2 _B,2 | F,,2 C,2 F,4 | E,4 A,,4 | D,4 C,4 |
 G,,2 D,2 G,2 B,2 | C,2 G,2 C4 | G,,2 D,2 G,4 | A,,2 E,2 A,4 |
 G,2 _B,2 C,2 _B,2 | F,,2 C,2 F,4 | E,2 B,2 A,,2 E,2 | D,2 F,2 C,2 E,2 |
 G,,2 D,2 G,2 B,2- | B,15/2 z/ | C,2 G,2 C2 G,2 | G,,2 D,2 G,2 D,2 |
 A,,2 E,2 A,2 E,2 | G,,2 D,2 C,4 | F,,2 C,2 F,2 C,2 | E,2 B,2 A,,2 E,2 |
 D,2 A,2 D4 | G,,2 D,2 G,4 | C,2 G,2 C2 G,2 | G,,2 D,2 G,2 D,2 |
 A,,2 E,2 A,2 E,2 | G,,2 D,2 C,2 G,2 | F,,2 C,2 F,2 C,2 | E,2 B,2 A,,2 E,2 |
 D,2 A,2 D4 | G,,2 D,2 G,4 | C,2 G,2 C4 | (24:23:2C,8 z/ |]
`;


</script> -->

<template>
  <main class="p-8">
    <ComboboxRoot v-model="selectedTunePath" class="relative">
      <ComboboxAnchor class="min-w-[160px] inline-flex items-center justify-between rounded-lg border border-stone-800/30 px-[15px] text-xs leading-none h-[35px] gap-[5px] bg-white/50 hover:bg-stone-50/50 transition-all duration-200 shadow-sm focus:shadow-[0_0_0_2px] focus:shadow-black outline-none">
        <ComboboxInput
          class="!bg-transparent outline-none h-full placeholder-stone-400"
          placeholder="Search a tune..."
        />
        <ComboboxTrigger>
          <Icon icon="radix-icons:chevron-down" class="h-4 w-4" />
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxContent class="absolute z-10 w-full mt-1 min-w-[160px] bg-white overflow-hidden rounded-lg shadow-sm border will-change-[opacity,transform]">
        <ComboboxViewport class="p-[5px]">
          <ComboboxEmpty class="text-xs font-medium text-center py-2 text-stone-400" />

          <ComboboxItem
            v-for="tune in tuneList"
            :key="tune.path"
            :value="tune.path"
            class="text-xs leading-none rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-stone-100"
          >
            <ComboboxItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
              <Icon icon="radix-icons:check" />
            </ComboboxItemIndicator>
            <span>{{ tune.title }}</span>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxRoot>

    <div class="w-3/4 mx-auto mt-10">
      <ABCRenderer v-if="tuneAbc" :abcNotation="tuneAbc" />
    </div>
  </main>
</template>

<script setup lang="ts">
// import { Icon } from '@iconify/vue'
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

// Grab all .abc files lazily
const tuneModules = import.meta.glob('~/assets/data/tunes/*.abc', { query: '?raw' })

// Build the list from file paths
const tuneList = Object.keys(tuneModules).map((path) => ({
  path,
  // "~/assets/data/tunes/nu-cuoi-1820.abc" → "nu-cuoi-1820"
  title: path.split('/').pop()!.replace('.abc', ''),
}))

const selectedTunePath = ref<string>(tuneList[0]?.path ?? '')
const tuneAbc = ref<string | null>(null)

async function loadTune(path: string) {
  if (!path) return
  const mod = await tuneModules[path]() as { default: string }
  tuneAbc.value = mod.default
}

// Load the initially selected tune
await loadTune(selectedTunePath.value)

// Reload whenever selection changes
watch(selectedTunePath, loadTune)

definePageMeta({
  colorMode: 'light',
})
</script>
