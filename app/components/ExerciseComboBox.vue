<script setup lang="ts">
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
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
import { STRENGTH_EXERCISES, type StrengthExercise } from '~/types/database.types'

const modelValue = defineModel<StrengthExercise | null>({ default: null })
const search = ref('')

const filteredExercises = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return STRENGTH_EXERCISES
  return STRENGTH_EXERCISES.filter(ex => ex.toLowerCase().includes(q))
})
</script>

<template>
  <ComboboxRoot
    v-model="modelValue"
    class="relative"
  >
    <ComboboxAnchor class="inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg- px-3 text-sm text-gray-900 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
      <ComboboxInput
        v-model="search"
        class="h-full w-full bg-transparent outline-none"
        placeholder="Select exercise..."
      />
      <ComboboxTrigger class="inline-flex items-center justify-center">
        <span class="i-tabler-chevron-down h-4 w-4 text-gray-600 dark:text-gray-300" />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg- shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <ComboboxViewport class="max-h-80 overflow-auto p-1">
        <ComboboxEmpty class="py-3 text-center text-sm text-gray-500 dark:text-gray-400">
          No exercises found.
        </ComboboxEmpty>

        <ComboboxGroup>
          <ComboboxLabel class="px-2 py-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Exercises
          </ComboboxLabel>

          <ComboboxItem
            v-for="exercise in filteredExercises"
            :key="exercise"
            :value="exercise"
            class="relative flex h-9 items-center rounded-md pl-8 pr-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ComboboxItemIndicator class="absolute left-2 inline-flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span class="i-mdi-check h-4 w-4" />
            </ComboboxItemIndicator>
            <span class="truncate">{{ exercise }}</span>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>
