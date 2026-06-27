<template>
  <DialogRoot>
    <DialogTrigger
      class="inline-flex items-center justify-center focus:shadow-black focus:outline-none cursor-pointer ml-6 border border-transparent border-1 hover:pb-1 focus:pb-1 hover:border-b-purple-600 focus:border-b-purple-600 duration-300 group"
    >
      <div class="i-mdi:plus text-purple-600 text-xl mr-2" />
      <span class="group-hover:text-purple-500 group-focus:text-purple-500 group-hover:font-semibold group-focus:font-semibold">Add Strength</span>

    </DialogTrigger>
    <DialogPortal>
      <AnimatePresence multiple>
        <DialogOverlay
          as-child
          class="bg-transparent backdrop-blur-md w-screen h-screen fixed inset-0 z-30 "
        >
          <Motion
            :initial="{ opacity: 0}"
            :animate="{ opacity: 1}"
            :exit="{ opacity: 0, scale: 0.6 }"
          />
        </DialogOverlay>
        <DialogContent
          as-child
          class="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-stone-700 p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-[100] text-gray-100"
        ><Motion
            :initial="{ opacity: 0, top: '40%' }"
            :animate="{ opacity: 1, top: '50%' }"
            :exit="{ opacity: 0, top: '30%' }"
          >
          <DialogTitle class="font-semibold mb-5 leading-normal">
            Strength Excercise
          </DialogTitle>

            <form class="space-y-4" @submit.prevent="onSubmit">
    <div>
      <label class="mb-1 block text-sm font-medium">Exercise</label>
      <ExerciseComboBox v-model="exercise" />
    </div>

    <div class="grid grid-cols-3 gap-3">
      <input v-model.number="sets" type="number" min="1" placeholder="Sets" class="w-full rounded-lg border px-3 py-2">
      <input v-model.number="reps" type="number" min="1" placeholder="Reps" class="w-full rounded-lg border px-3 py-2">
      <input v-model.number="weight" type="number" min="0" step="0.5" placeholder="Weight" class="w-full rounded-lg border px-3 py-2">
    </div>

    <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    <p v-if="successMsg" class="text-sm text-emerald-600">{{ successMsg }}</p>


    <DialogClose>
              <button
                class="inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-semibold leading-none focus:shadow-[0_0_0_2px] focus:outline-none cursor-pointer disabled:opacity-50" :disabled="loading"
              >
                {{ loading ? 'Saving...' : 'Save workout' }}
              </button>
            </DialogClose>
  </form>

          <!-- <div class="mt-[25px] flex justify-end">

          </div> -->
          <DialogClose
            class="absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
            aria-label="Close" as-child
          >
          </DialogClose>

        </Motion>
        </DialogContent>
      </AnimatePresence>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "reka-ui";
import { AnimatePresence, Motion } from "motion-v";

import type { MuscleGroup,StrengthExercise } from "~/types/database.types";

import { ref } from 'vue'

const supabase = useSupabaseClient()

const exercise = ref<StrengthExercise | null>(null)
const sets = ref<number | null>(null)
const reps = ref<number | null>(null)
const weight = ref<number | null>(null)

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function onSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!exercise.value) {
    errorMsg.value = 'Please select an exercise.'
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.from('strength').insert({
      exercise: exercise.value, // supabase enum: strength_exercise
    //   sets: sets.value,
    //   reps: reps.value,
    //   weight: weight.value,
    })

    if (error) throw error

    successMsg.value = 'Workout saved.'
    exercise.value = null
    sets.value = null
    reps.value = null
    weight.value = null
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Failed to save workout.'
  } finally {
    loading.value = false
  }
}

</script>

<style></style>
