<script setup lang="ts" generic="T extends string">
import { computed, ref } from 'vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'

const props = withDefaults(
  defineProps<{
    options: readonly T[]
    label?: string
    placeholder?: string
    emptyMessage?: string
  }>(),
  {
    label: 'Options',
    placeholder: 'Select…',
    emptyMessage: 'No results found.',
  },
)

const modelValue = defineModel<T | null>({ default: null })
const search = ref('')

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((opt) => opt.toLowerCase().includes(q))
})
</script>

<template>
  <ComboboxRoot v-model="modelValue">
    <ComboboxAnchor
      class="inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/30 backdrop-blur-xl backdrop-saturate-150 px-3 text-sm text-stone-900 dark:text-gray-100 outline-none focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-2 transition-colors"
    >
      <ComboboxInput
        v-model="search"
        class="h-full w-full bg-transparent outline-none placeholder-stone-500 dark:placeholder-stone-400"
        :placeholder="placeholder"
      />
      <ComboboxTrigger class="inline-flex items-center justify-center">
        <span class="i-tabler-chevron-down h-4 w-4 text-stone-600 dark:text-gray-300" />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="4"
        class="z-30 w-[var(--reka-combobox-trigger-width)] overflow-hidden rounded-xl border border-white/40 dark:border-white/10 bg-white/45 dark:bg-stone-800/50 backdrop-blur-xl backdrop-saturate-150 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]"
      >
        <ComboboxViewport class="max-h-80 overflow-auto p-1">
          <ComboboxEmpty class="py-3 text-center text-sm text-stone-500 dark:text-stone-400">
            {{ emptyMessage }}
          </ComboboxEmpty>

          <ComboboxGroup class="text-stone-900 dark:text-gray-100">
            <ComboboxLabel class="px-3 py-2 text-xs font-medium uppercase tracking-wide">
              {{ label }}
            </ComboboxLabel>

            <ComboboxItem
              v-for="option in filteredOptions"
              :key="option"
              :value="option"
              class="relative flex h-9 items-center rounded-md pl-8 pr-2 text-sm cursor-pointer outline-none data-[highlighted]:bg-purple-400/20 dark:data-[highlighted]:bg-purple-500/20 transition-colors"
            >
              <ComboboxItemIndicator
                class="absolute left-2 inline-flex items-center justify-center text-purple-600 dark:text-purple-400"
              >
                <span class="i-mdi-check h-4 w-4" />
              </ComboboxItemIndicator>
              <span class="truncate">{{ option }}</span>
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
