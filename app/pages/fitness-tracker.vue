<script setup>
import { parseDateTime, DateFormatter, today, getDayOfWeek } from '@internationalized/date'
// Create the formatter once
const df = new DateFormatter('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dayToColor = [
  'bg-amber-400/50', // 0: Monday
  'bg-emerald-400/50', // 1: Tuesday
  'bg-sky-400/50', // 2: Wednesday
  'bg-indigo-400/50', // 3: Thursday
  'bg-purple-400/50', // 4: Friday
  'bg-rose-400/50', // 5: Saturday
  'bg-teal-400/50', // 6: Sunday
]

useHead({
  title: 'Body.exe',
  meta: [
    { name: 'description', content: 'Activity and metric logs.' },
  ]
})

const client = useSupabaseClient()
const {
  data: strengthExercises,
  pending: isLoading,
  error: errorMessage,
  refresh: fetchEntries,
} = await useAsyncData('strength-entries', async () => {
  const { data, error } = await client
    .from('strength')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Map through the rows and format the date string for @internationalized/date
  return data ?? []
  //   return (data ?? []).map((items) => ({
  //     ...items,
  //     date: items.date ? items.date.replace(' ', 'T') : items.date,
  //   }))
})

// Filter today's entries reactively
const todayStrengthExercises = computed(() => {
  const currentDate = today('UTC')

  return (strengthExercises.value ?? []).filter((item) => {
    if (!item?.date) return false
    const itemDate = parseDateTime(item.date)
    return itemDate.compare(currentDate) === 0
  })
})
</script>

<template>
  <div class="min-h-screen">
    <div
      class="grid lg:grid-cols-6 gap-4 max-w-9/10 lg:max-w-4/5 px-4 pt-20 py-4 mx-auto font-sans dark:text-gray-100"
    >
      <div
        class="lg:col-span-4 w-full h-max border-gray-900/15 dark:border-gray-100/10 border-1 p-4 border-rounded-lg"
      >
        <h2
          class="border-rounded-full w-max px-3 py-2 hover:bg-gray-400/30 transition-all duration-300 flex items-center gap-2 font-bold cursor-pointer font-sans text-base"
        >
          <div class="i-tabler:layout-grid" />
          Today workouts
        </h2>
        <ul class="grid grid-cols-2 lg:grid-cols-3 items-stretch w-full gap-2 my-4">
          <li
            v-for="items in todayStrengthExercises"
            :key="items.id"
            class="bg-stone-300/30 hover:bg-stone-500/30 dark:bg-stone-700/30 dark:hover:bg-stone-500/30 duration-200 w-full border-rounded-md cursor-pointer p-4"
          >
            <h3 class="font-bold flex items-center gap-2 font-sans text-base">
              <div class="i-mdi:dumbbell" />
              {{ items.exercise }}
            </h3>
            <div class="text-sm mt-1">
              {{ df.format(parseDateTime(items.date).toDate('UTC')) }}
            </div>

            <!-- {{ items.muscles }} -->

            <ul class="flex flex-wrap gap-1 text-xs mt-4">
              <li
                v-for="muscle in items.muscles"
                :key="`${items.id}-${muscle}`"
                class="w-max rounded-lg px-2 py-1 bg-purple-400/10 hover:bg-purple-400/50 transition-all duration-200"
              >
                {{ muscle }}
              </li>
            </ul>
          </li>
          <StrengthForm>
            <li
              v-if="todayStrengthExercises.length < 3"
              class="border-stone-700/30 border-1 hover:border-gray-400/30 border-dashed flex items-center justify-center duration-200 w-full border-rounded-md cursor-pointer p-4 min-h-24"
            >
              <div class="i-mdi:plus" /></li
          ></StrengthForm>
        </ul>
      </div>
      <div class="lg:col-span-2 lg:order-first w-full h-max p-4">
        <h2
          class="border-rounded-full px-3 py-2 w-max flex items-center gap-2 font-semibold font-sans text-lg"
        >
          Quick actions
        </h2>
        <StrengthForm>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded="false"
            data-state="closed"
            class="inline-flex items-center justify-center focus:shadow-black focus:outline-none cursor-pointer ml-6 border border-transparent border-1 hover:pb-1 focus:pb-1 hover:border-b-purple-600 focus:border-b-purple-600 group transition-all duration-200"
          >
            <div class="i-mdi:plus text-purple-600 text-xl mr-2" />
            <span
              class="group-hover:text-purple-500 group-focus:text-purple-500 group-hover:font-semibold group-focus:font-semibold"
              >Add Strength</span
            >
          </button></StrengthForm
        >
      </div>

      <div
        class="lg:col-span-6 w-full h-max border-gray-900/15 dark:border-gray-100/10 border-1 p-4 border-rounded-lg"
      >
        <h2
          class="border-rounded-full w-max px-3 py-2 hover:bg-gray-400/30 transition-all duration-300 flex items-center gap-2 font-bold cursor-pointer font-sans text-base"
        >
          <div class="i-tabler:layout-grid" />
          Strength Workouts
        </h2>
        <ul class="grid grid-cols-3 lg:grid-cols-4 items-stretch w-full gap-2 my-4">
          <li
            v-for="items in strengthExercises"
            :key="items.id"
            class="bg-stone-300/30 hover:bg-stone-500/30 dark:bg-stone-700/30 dark:hover:bg-stone-500/30 duration-200 w-full border-rounded-md cursor-pointer p-4"
          >
            <h3 class="font-bold flex items-center gap-2 font-sans text-base">
              <div class="i-mdi:dumbbell" />
              {{ items.exercise }}
            </h3>

            <div class="text-sm mt-2 flex gap-1">
              <div
                class="text-base rounded-sm my-auto w-3 aspect-square inline-block self-center"
                :class="dayToColor[(getDayOfWeek(parseDateTime(items.date), 'en-GB') + 6) % 7]"
              ></div>
              <!-- <span class="text-base">{{dayFormat.format(parseDateTime(items.date).toDate('UTC'))}}, </span> -->
              {{ df.format(parseDateTime(items.date).toDate('UTC')) }}
            </div>

            <ul class="flex flex-wrap gap-1 text-xs mt-4">
              <li
                v-for="muscle in items.muscles"
                :key="`${items.id}-${muscle}`"
                class="w-max rounded-lg px-2 py-1 bg-purple-600/20 hover:bg-purple-400/50 dark:bg-purple-400/10 dark:hover:bg-purple-400/50 transition-all duration-200"
              >
                {{ muscle }}
              </li>
            </ul>
          </li>
          <StrengthForm>
            <li
              v-if="strengthExercises.length < 4"
              class="border-stone-700/30 border-1 hover:border-gray-400/30 border-dashed flex items-center justify-center duration-200 w-full border-rounded-md cursor-pointer p-4 min-h-24"
            >
              <div class="i-mdi:plus" /></li
          ></StrengthForm>
        </ul>
      </div>
    </div>
  </div>
</template>
