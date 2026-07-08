<script setup lang="ts">
import type { StrengthExercise } from '~/types/database.types'

interface RoutineExercise {
  display: string
  canonical: StrengthExercise
  detail: string
  isApproximate?: boolean
}

interface RoutineDay {
  day: string
  label: string
  target?: string
  exercises?: RoutineExercise[]
  note?: string
}

const schedule: RoutineDay[] = [
  {
    day: 'Monday',
    label: 'Push A (Power/Size)',
    target: 'Upper Chest, Front Delts, Triceps Heavy',
    exercises: [
      { display: 'Incline Dumbbell Press', canonical: 'Incline DB Bench Press', detail: '4×6–8' },
      { display: 'Overhead Barbell Press', canonical: 'Barbell Overhead Press', detail: '3×8–10' },
      { display: 'Flat Bench Press', canonical: 'Flat Barbell Bench Press', detail: '3×8–10' },
      { display: 'Dumbbell Lateral Raises', canonical: 'DB Lateral Raise', detail: '4×12–15' },
      { display: 'Heavy Weighted Dips', canonical: 'Chest Dip', detail: '3×8–10' },
    ],
  },
  {
    day: 'Tuesday',
    label: 'Pull A (Width/Thickness)',
    target: 'Upper Lats, Mid-Back, Biceps Heavy',
    exercises: [
      { display: 'Lat Pulldowns (Wide Grip)', canonical: 'Lat Pulldown', detail: '4×8–10' },
      { display: 'Chest-Supported T-Bar Row', canonical: 'Chest-supported Row', detail: '3×8–10' },
      { display: 'Seated Cable Row', canonical: 'DB Row', detail: '3×10–12', isApproximate: true },
      { display: 'Standing Barbell Curls', canonical: 'Barbell Curl', detail: '3×8–10' },
      { display: 'Hammer Curls', canonical: 'Hammer Curl', detail: '3×10–12' },
    ],
  },
  {
    day: 'Wednesday',
    label: 'Mid-Week Mobility & Core',
    note: 'Planks, hanging knee raises, bird-dogs, Pigeon Pose, Butterfly Stretch — not logged here, this app only tracks weighted strength sets.',
  },
  {
    day: 'Thursday',
    label: 'Push B (Sculpt/Pump)',
    target: 'Mid/Lower Chest, Side Delts, Tricep Isolation',
    exercises: [
      {
        display: 'Decline Bench Press',
        canonical: 'Decline Barbell Bench Press',
        detail: '3×12–15',
      },
      {
        display: 'Incline Machine Press',
        canonical: 'Machine Chest Press',
        detail: '3×10–12',
        isApproximate: true,
      },
      { display: 'Cable Lateral Raises', canonical: 'Cable Lateral Raise', detail: '4×15' },
      { display: 'Incline Front Raises', canonical: 'Front Raise', detail: '3×12' },
      { display: 'Tricep Rope Pushdowns', canonical: 'Triceps Pushdown', detail: '4×12–15' },
    ],
  },
  {
    day: 'Friday',
    label: 'Pull B (Detail/Arms)',
    target: 'Lower Lats, Rear Delts, Arm Volume',
    exercises: [
      { display: 'Pull-Ups', canonical: 'Pull-Up', detail: '4×max' },
      { display: 'Single-Arm DB Row', canonical: 'DB Row', detail: '3×10–12/side' },
      { display: 'Dumbbell Rear Delt Flyes', canonical: 'Rear Delt Fly', detail: '4×15' },
      { display: 'Incline Dumbbell Curls', canonical: 'Incline DB Curl', detail: '3×12' },
      { display: 'Preacher Curls', canonical: 'Preacher Curl', detail: '3×12' },
    ],
  },
  {
    day: 'Saturday',
    label: 'Flex Cardio & Lotus (Optional)',
    note: 'Incline treadmill 20 min + Frog Pose stretch — skip if needed, not logged here.',
  },
  { day: 'Sunday', label: 'Rest', note: 'Complete recovery.' },
]
</script>

<template>
  <div class="card">
    <h2
      class="border-rounded-full w-max px-3 py-2 flex items-center gap-2 font-bold font-head text-base"
    >
      <div class="i-tabler:calendar-week" />
      Weekly Split
    </h2>

    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
      <div
        v-for="day in schedule"
        :key="day.day"
        class="rounded-xl bg-white/30 dark:bg-stone-700/30 p-4 flex flex-col gap-2"
      >
        <div>
          <p class="text-xs uppercase tracking-wide opacity-90">{{ day.day }}</p>
          <p class="text-sm font-semibold">{{ day.label }}</p>
          <p v-if="day.target" class="text-xs opacity-90">{{ day.target }}</p>
        </div>

        <p v-if="day.note" class="text-xs opacity-90 italic mt-1">{{ day.note }}</p>

        <ul v-if="day.exercises" class="flex flex-col gap-1 mt-1">
          <li v-for="ex in day.exercises" :key="ex.display">
            <StrengthForm :preset-exercise="ex.canonical">
              <button
                type="button"
                class="w-full text-left text-sm rounded-md px-2 py-1.5 -mx-2 hover:bg-purple-400/20 dark:hover:bg-purple-500/20 transition-colors flex items-center justify-between gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <span class="truncate">
                  {{ ex.display }}
                  <span
                    v-if="ex.isApproximate"
                    class="text-stone-400"
                    title="Closest matching exercise in your library"
                    >*</span
                  >
                </span>
                <!-- <span class="text-xs opacity-90 shrink-0">{{ ex.detail }}</span> -->
              </button>
            </StrengthForm>
          </li>
        </ul>
      </div>
    </div>

    <p class="text-xs opacity-90 mt-3">
      * Closest matching exercise available in your library, not an exact name match.
    </p>
  </div>
</template>
