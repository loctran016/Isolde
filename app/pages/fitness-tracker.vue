<script setup>
import dayjs from "dayjs";

definePageMeta({
  colorMode: 'dark',
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
  return data ?? []
})

// Filter today's entries reactively
const todayStrengthExercises = computed(() => {
  return (strengthExercises.value ?? []).filter((item) =>
    dayjs(item.created_at).isSame(dayjs(), 'day')
  )
})

// Optional: equivalent to your old queryData()
async function queryData() {
  await fetchEntries()
}
</script>

<template>
  <div
    class="grid lg:grid-cols-6 gap-4 max-w-9/10 lg:max-w-4/5 mt-16 px-4 py-4 mx-auto font-sans dark:text-gray-100"
  >

    <div
      class="lg:col-span-4 w-full border-gray-100/10 border-1 p-4 border-rounded-lg"
    >
      <h2
        class="border-rounded-full w-max px-3 py-2 hover:bg-gray-400/30 transition-all duration-300 flex items-center gap-2 font-bold cursor-pointer font-sans text-base"
      >
        <div class="i-tabler:layout-grid" />
        Today workouts
      </h2>
      <ul class="grid grid-cols-2 lg:grid-cols-3 items-stretch w-full gap-2 mt-4">
        <li
          v-for="items in strengthExercises"
          :key="items.id"
          class="bg-stone-700/30 hover:bg-stone-500/30 duration-200 w-full border-rounded-md cursor-pointer p-4"
        >
          <h3 class="font-bold flex items-center gap-2 font-sans text-base">
            <div class="i-mdi:dumbbell" />
            {{ items.exercise }}
          </h3>
          <div class="text-sm">
            {{ dayjs(`${items.date}`).format("DD/MM/YYYY") }}
          </div>

          <!-- {{ items.muscle }} -->

          <!-- <ul>
            <li v-for="[reps, weight] in items.sets">
              {{ reps }} reps - {{ weight }}kg
            </li>
          </ul> -->
        </li>
        <li
          v-if="todayStrengthExercises.length < 3"
          class="border-stone-700/30 border-1 hover:border-gray-400/30 border-dashed flex items-center justify-center duration-200 w-full border-rounded-md cursor-pointer p-4"
        >
          <div class="i-mdi:plus" />
        </li>
      </ul>
    </div>
<div class="lg:col-span-2 lg:order-first w-full p-4">
          <h2
    class="border-rounded-full px-3 py-2 w-max flex items-center gap-2 font-semibold font-sans text-lg"
  >
    Quick actions
  </h2>
      <StrengthForm />
    </div>
  </div>
</template>
