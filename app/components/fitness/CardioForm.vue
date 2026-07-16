<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRegle } from '@regle/core'
import { required, numeric, minValue, withMessage } from '@regle/rules'

type CardioExercise = 'Treadmill Running' | 'Swimming' | 'Running' | 'Cycling' | 'Yoga'

const CARDIO_EXERCISES: CardioExercise[] = [
  'Treadmill Running',
  'Swimming',
  'Running',
  'Cycling',
  'Yoga',
]

// rename CARDIO_EXERCISES → optionLists, per your naming convention
const optionLists: CardioExercise[] = [
  'Treadmill Running',
  'Swimming',
  'Running',
  'Cycling',
  'Yoga',
]

const supabase = useSupabaseClient()
const open = ref(false)

const form = ref<{
  exercise: CardioExercise | null
  duration: number | null
  distance: number | null
}>({
  exercise: null,
  duration: null,
  distance: null,
})

// Yoga has no meaningful distance — hide (and later strip) that field for it
const showsDistance = computed(() => form.value.exercise != null && form.value.exercise !== 'Yoga')

const { r$ } = useRegle(form, {
  exercise: { required: withMessage(required, 'Please select an activity.') },
  duration: {
    required: withMessage(required, 'Enter duration in minutes.'),
    numeric,
    minValue: minValue(1),
  },
  distance: {
    numeric,
    minValue: minValue(0),
  },
})

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function resetForm() {
  form.value.exercise = null
  form.value.duration = null
  form.value.distance = null
  r$.$reset({ toInitialState: true })
}

watch(open, (v) => {
  if (v) {
    errorMsg.value = ''
    successMsg.value = ''
  }
})

// If the user picks Yoga after already typing a distance, clear it —
// don't silently carry over an irrelevant value.
watch(
  () => form.value.exercise,
  (val) => {
    if (val === 'Yoga') form.value.distance = null
  },
)

async function onSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  const { valid, data } = await r$.$validate()
  if (!valid) return

  loading.value = true
  try {
    const { error } = await supabase.from('cardio').insert({
      exercise: data.exercise,
      duration: data.duration,
      distance: showsDistance.value ? data.distance : null,
    })

    if (error) throw error

    await refreshNuxtData('cardio-entries')
    successMsg.value = 'Cardio session saved.'
    resetForm()
    open.value = false
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Failed to save cardio session.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <FormWrapper v-model:open="open" title="Cardio Session">
    <template #trigger>
      <slot />
    </template>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <!-- template: replace the entire <select> block -->
      <div>
        <label class="mb-1 block text-sm font-medium">Activity</label>
        <ComboBox
          v-model="form.exercise"
          :options="optionLists"
          label="Activities"
          placeholder="Select an activity..."
          empty-message="No activities found."
        />
        <p v-if="r$.exercise.$error" class="text-xs text-red-600 dark:text-red-400 mt-1">
          {{ r$.exercise.$errors[0] }}
        </p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Duration (minutes)</label>
        <input
          v-model.number="form.duration"
          type="number"
          inputmode="numeric"
          min="0"
          step="1"
          placeholder="e.g. 30"
          class="w-full focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
        />
        <p v-if="r$.duration.$error" class="text-xs text-red-600 dark:text-red-400 mt-1">
          {{ r$.duration.$errors[0] }}
        </p>
      </div>

      <div v-if="showsDistance">
        <label class="mb-1 block text-sm font-medium"
          >Distance (km) <span class="text-stone-400 font-normal">optional</span></label
        >
        <input
          v-model.number="form.distance"
          type="number"
          inputmode="numeric"
          min="0"
          step="0.1"
          placeholder="e.g. 5"
          class="w-full focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
        />
        <p v-if="r$.distance.$error" class="text-xs text-red-600 dark:text-red-400 mt-1">
          {{ r$.distance.$errors[0] }}
        </p>
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
        {{ loading ? 'Saving...' : 'Save session' }}
      </button>
    </form>
  </FormWrapper>
</template>
