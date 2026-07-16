<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRegle } from '@regle/core'
import { required, requiredIf, numeric, minValue, minLength, withMessage } from '@regle/rules'
import {
  EXERCISE_TO_MUSCLES,
  STRENGTH_EXERCISES,
  type StrengthExercise,
  type StrengthRecord,
  type Database,
} from '~/types/database.types'

const optionLists = STRENGTH_EXERCISES
const props = defineProps<{
  presetExercise?: StrengthExercise
  editRecord?: StrengthRecord | null
}>()
const supabase = useSupabaseClient()

const open = ref(false)

interface SetInput {
  reps: number | null
  kg: number | null
}

function emptySets(): SetInput[] {
  // 3 starting rows for convenience; validation still only requires 2 complete
  return [
    { reps: null, kg: null },
    { reps: null, kg: null },
    { reps: null, kg: null },
  ]
}

const form = ref<{ exercise: StrengthExercise | null; sets: SetInput[] }>({
  exercise: null,
  sets: emptySets(),
})

const isEditMode = computed(() => !!props.editRecord)

const { r$ } = useRegle(form, {
  exercise: { required: withMessage(required, 'Please select an exercise.') },
  sets: {
    minLength: withMessage(minLength(2), 'Add at least two sets with reps and weight.'),
    atLeastTwoComplete: withMessage(
      (value: SetInput[]) => value.filter((s) => s.reps != null && s.kg != null).length >= 2,
      'Add at least two complete sets (reps and kg).',
    ),
    $each: (item) => ({
      reps: {
        requiredIf: withMessage(
          requiredIf(() => item.value.kg != null),
          'Enter reps for this set.',
        ),
        numeric,
        minValue: minValue(1),
      },
      kg: {
        requiredIf: withMessage(
          requiredIf(() => item.value.reps != null),
          'Enter weight for this set.',
        ),
        numeric,
        minValue: minValue(0),
      },
    }),
  },
})

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function addSet() {
  form.value.sets.push({ reps: null, kg: null })
}
function removeSet(index: number) {
  form.value.sets.splice(index, 1)
}

// Epley formula — standard 1RM estimate, most reliable in the 1–10 rep range
function estimateOneRepMax(reps: number, kg: number) {
  return kg * (1 + reps / 30)
}

function resetForm() {
  form.value.exercise = null
  form.value.sets = emptySets()
  r$.$reset({ toInitialState: true })
}

watch(open, (v) => {
  if (!v) return
  errorMsg.value = ''
  successMsg.value = ''

  if (props.editRecord) {
    // Editing an existing entry — lock exercise, prefill its logged sets
    form.value.exercise = props.editRecord.exercise
    form.value.sets = props.editRecord.sets.length
      ? props.editRecord.sets.map(([reps, kg]) => ({ reps, kg }))
      : emptySets()
  } else if (props.presetExercise) {
    form.value.exercise = props.presetExercise
  }
})

async function onSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  const { valid, data } = await r$.$validate()
  if (!valid) return

  loading.value = true
  try {
    const exerciseKey = data.exercise as StrengthExercise
    const muscles = EXERCISE_TO_MUSCLES[exerciseKey] ?? []

    const parsedSets: number[][] = data.sets
      .filter((s) => s.reps != null && s.kg != null)
      .map((s) => [s.reps as number, s.kg as number])

    const totalVolume = parsedSets.reduce((sum, [reps, kg]) => sum + reps * kg, 0)
    const oneRepMax = parsedSets.length
      ? Math.round(Math.max(...parsedSets.map(([reps, kg]) => estimateOneRepMax(reps, kg))) * 10) /
        10
      : 0

    if (isEditMode.value && props.editRecord) {
      const { error } = await supabase
        .from<Database['public']['Tables']['strength']['Update']>('strength')
        .update({
          sets: parsedSets,
          muscles: [...muscles],
          one_rep_max: oneRepMax,
          total_volume: totalVolume,
        })
        .eq('id', props.editRecord.id)

      if (error) throw error
      successMsg.value = 'Workout updated.'
    } else {
      const { error } = await supabase
        .from<Database['public']['Tables']['strength']['Insert']>('strength')
        .insert({
          exercise: exerciseKey,
          sets: parsedSets,
          muscles: [...muscles],
          one_rep_max: oneRepMax,
          total_volume: totalVolume,
        })

      if (error) throw error
      successMsg.value = 'Workout saved.'
    }

    await refreshNuxtData('strength-entries')
    resetForm()
    open.value = false
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Failed to save workout.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <FormWrapper v-model:open="open" :title="isEditMode ? 'Edit Exercise' : 'Strength Exercise'">
    <template #trigger>
      <slot />
    </template>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div>
        <label class="mb-1 block text-sm font-medium">Exercise</label>

        <ComboBox
          v-if="!isEditMode"
          v-model="form.exercise"
          :options="optionLists"
          label="Exercises"
          placeholder="Select exercise..."
          empty-message="No exercises found."
        />
        <div
          v-else
          class="w-full rounded-xl border border-white/40 dark:border-white/10 bg-white/20 dark:bg-stone-700/20 px-3 py-2.5 text-sm opacity-80 cursor-not-allowed"
        >
          {{ form.exercise }}
        </div>

        <p v-if="r$.exercise.$error" class="text-sm text-red-600 dark:text-red-400 mt-1">
          {{ r$.exercise.$errors[0] }}
        </p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Sets</label>
        <div class="space-y-2">
          <div
            v-for="(set, index) in form.sets"
            :key="r$.sets.$each[index]?.$id ?? index"
            class="space-y-1"
          >
            <div class="grid grid-cols-[1fr_auto_1fr_auto_auto] items-center gap-2">
              <input
                v-model.number="set.reps"
                type="number"
                inputmode="numeric"
                min="0"
                step="1"
                placeholder="reps"
                class="w-full focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
              />
              <span class="text-sm">reps x</span>
              <input
                v-model.number="set.kg"
                type="number"
                inputmode="numeric"
                min="0"
                step="0.5"
                placeholder="kg"
                class="w-full focus:outline-none focus:border-purple-600 border-b-gray-500/30 dark:border-b-gray-100/50 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
              />
              <span class="text-sm">kg</span>
              <button
                v-if="form.sets.length > 2"
                type="button"
                class="text-sm text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Remove set"
                @click="removeSet(index)"
              >
                ✕
              </button>
            </div>

            <p
              v-if="r$.sets.$each[index]?.reps.$error"
              class="text-xs text-red-600 dark:text-red-400"
            >
              {{ r$.sets.$each[index].reps.$errors[0] }}
            </p>
            <p
              v-if="r$.sets.$each[index]?.kg.$error"
              class="text-xs text-red-600 dark:text-red-400"
            >
              {{ r$.sets.$each[index].kg.$errors[0] }}
            </p>
          </div>

          <button type="button" class="text-sm text-purple-600 hover:underline" @click="addSet">
            + Add set
          </button>

          <p v-if="r$.sets.$self.$error" class="text-xs text-red-600 dark:text-red-400">
            {{ r$.sets.$self.$errors[0] }}
          </p>
        </div>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400 bg-red-950/60">
        {{ errorMsg }}
      </p>
      <p v-if="successMsg" class="text-sm text-emerald-600 dark:text-emerald-400">
        {{ successMsg }}
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="flex ml-auto px-3 py-3 mt-6 hover:scale-101 hover:-translate-y-0.5 hover:shadow-lg items-center justify-center border-1 border-stone-700/90 dark:border-stone-100/50 hover:dark:border-stone-100/80 transition-all duration-200 rounded-md px-[15px] leading-none focus:shadow-[0_0_0_2px] focus:outline-none cursor-pointer disabled:opacity-60"
      >
        {{ loading ? 'Saving...' : isEditMode ? 'Save changes' : 'Save workout' }}
      </button>
    </form>
  </FormWrapper>
</template>
