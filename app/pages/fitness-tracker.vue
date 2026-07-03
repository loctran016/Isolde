<script setup>
import { parseDateTime, today } from '@internationalized/date'

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
})

// Filter today's entries reactively
const todayStrengthExercises = computed(() => {
  const currentDate = today('Asia/Ho_Chi_Minh')

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
          class="border-rounded-full w-max font-head px-3 py-2 hover:bg-gray-400/30 transition-all duration-300 flex items-center gap-2 font-bold cursor-pointer text-base"
        >
          <div class="i-tabler:layout-grid" />
          Today workouts
        </h2>
        <ul class="grid grid-cols-2 lg:grid-cols-3 items-stretch w-full gap-2 my-4">
          <ExerciseCard
            v-for="items in todayStrengthExercises"
            :key="items.id"
            :exercise="items"
            variant="today"
          />
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
          class="border-rounded-full px-3 py-2 w-max flex items-center gap-2 font-semibold font-head text-lg"
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
          class="border-rounded-full w-max px-3 py-2 hover:bg-gray-400/30 transition-all duration-300 flex items-center gap-2 font-bold cursor-pointer font-head text-base"
        >
          <div class="i-tabler:layout-grid" />
          Strength Workouts
        </h2>
        <ul class="grid grid-cols-3 lg:grid-cols-4 items-stretch w-full gap-2 my-4">
          <ExerciseCard
            v-for="items in strengthExercises"
            :key="items.id"
            :exercise="items"
            variant="all"
          />
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
