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

const open = defineModel<boolean>('open', { default: false })

interface SetInput {
  reps: number | null
  kg: number | null
}

const REPS_STEP = 1
const KG_STEP = 2.5

function emptySets(prefill?: SetInput): SetInput[] {
  const base = prefill ?? { reps: null, kg: null }
  return [{ ...base }, { ...base }, { ...base }]
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
const prefilling = ref(false)

function addSet() {
  // New sets default to a copy of the last row, not blank — matches
  // "80% of the time, just tap save" goal for sets 3+ too.
  const last = form.value.sets[form.value.sets.length - 1]
  form.value.sets.push(last ? { ...last } : { reps: null, kg: null })
}
function removeSet(index: number) {
  form.value.sets.splice(index, 1)
}
function duplicateSet(index: number) {
  const source = form.value.sets[index]
  form.value.sets.splice(index + 1, 0, { ...source })
}

function stepReps(index: number, delta: number) {
  const current = form.value.sets[index].reps ?? 0
  form.value.sets[index].reps = Math.max(0, current + delta)
}
function stepKg(index: number, delta: number) {
  const current = form.value.sets[index].kg ?? 0
  form.value.sets[index].kg = Math.max(0, Math.round((current + delta) * 10) / 10)
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

// --- Smart pre-fill: pull the last logged set for the selected exercise ---
async function prefillFromHistory(exercise: StrengthExercise) {
  prefilling.value = true
  try {
    const { data, error } = await supabase
      .from('strength')
      .select('sets')
      .eq('exercise', exercise)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data?.sets?.length) return

    const [reps, kg] = data.sets[data.sets.length - 1]
    // Only prefill if the user hasn't already started typing values themselves
    const untouched = form.value.sets.every((s) => s.reps == null && s.kg == null)
    if (untouched) form.value.sets = emptySets({ reps, kg })
  } catch (e) {
    console.error('Failed to prefill from history', e)
  } finally {
    prefilling.value = false
  }
}

watch(open, (v) => {
  if (!v) return
  errorMsg.value = ''
  successMsg.value = ''

  if (props.editRecord) {
    form.value.exercise = props.editRecord.exercise
    form.value.sets = props.editRecord.sets.length
      ? props.editRecord.sets.map(([reps, kg]) => ({ reps, kg }))
      : emptySets()
  } else if (props.presetExercise) {
    form.value.exercise = props.presetExercise
    prefillFromHistory(props.presetExercise)
  }
})

// Also prefill when the exercise is picked manually (add-mode only)
watch(
  () => form.value.exercise,
  (exercise) => {
    if (!isEditMode.value && exercise) prefillFromHistory(exercise)
  },
)

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
        <p v-if="prefilling" class="text-xs opacity-50 mt-1">Loading last workout…</p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Sets</label>
        <div class="space-y-2">
          <div
            v-for="(set, index) in form.sets"
            :key="r$.sets.$each[index]?.$id ?? index"
            class="space-y-1"
          >
            <div class="flex items-center gap-1.5">
              <!-- Reps stepper -->
              <button
                type="button"
                class="shrink-0 w-8 h-8 rounded-md border opacity-20 hover:opacity-80 duration-200 border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50 hover:bg-purple-400/10 flex items-center justify-center text-lg cursor-pointer"
                aria-label="Decrease reps"
                @click="stepReps(index, -REPS_STEP)"
              >
                −
              </button>
              <input
                v-model.number="set.reps"
                type="number"
                inputmode="numeric"
                min="0"
                step="1"
                placeholder="reps"
                class="w-14 text-center focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-1 py-2 border-0 border-b-2"
              />
              <button
                type="button"
                class="shrink-0 w-8 h-8 rounded-md border opacity-20 hover:opacity-80 duration-200 border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50 hover:bg-purple-400/10 flex items-center justify-center text-lg cursor-pointer"
                aria-label="Increase reps"
                @click="stepReps(index, REPS_STEP)"
              >
                +
              </button>

              <span class="text-sm px-1 shrink-0">x</span>

              <!-- Weight stepper -->
              <button
                type="button"
                class="shrink-0 w-8 h-8 rounded-md border opacity-20 hover:opacity-80 duration-200 border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50 hover:bg-purple-400/10 flex items-center justify-center text-lg cursor-pointer"
                aria-label="Decrease weight"
                @click="stepKg(index, -KG_STEP)"
              >
                −
              </button>
              <input
                v-model.number="set.kg"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.5"
                placeholder="kg"
                class="w-16 text-center focus:outline-none focus:border-purple-600 border-b-gray-500/30 dark:border-b-gray-100/50 transition-all duration-200 border px-1 py-2 border-0 border-b-2"
              />
              <button
                type="button"
                class="shrink-0 w-8 h-8 rounded-md border opacity-20 hover:opacity-80 duration-200 border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50 hover:bg-purple-400/10 flex items-center justify-center text-lg cursor-pointer"
                aria-label="Increase weight"
                @click="stepKg(index, KG_STEP)"
              >
                +
              </button>
              <span class="text-sm shrink-0">kg</span>

              <!-- Duplicate / remove actions -->
              <button
                type="button"
                class="shrink-0 ml-auto p-1.5 text-stone-500 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                aria-label="Duplicate this set"
                title="Duplicate this set"
                @click="duplicateSet(index)"
              >
                <div class="i-mdi:content-copy text-base" />
              </button>
              <button
                v-if="form.sets.length > 2"
                type="button"
                class="shrink-0 p-1.5 text-stone-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                aria-label="Remove set"
                title="Remove set"
                @click="removeSet(index)"
              >
                <div class="i-mdi:trash-can-outline text-base" />
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
