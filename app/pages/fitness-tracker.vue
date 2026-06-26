<script setup>
import { ref, onMounted } from "vue";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

const config = useRuntimeConfig();
const supabase = createClient(
  config.public.supabaseUrl,
  config.public.supabaseKey,
);

const strengthExcercises = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);

async function fetchEntries() {
  try {
    isLoading.value = true;
    const { data, error } = await supabase.from("strength").select("*");

    if (error) throw error;
    strengthExcercises.value = data;
  } catch (error) {
    errorMessage.value = error.message;
    console.error("Error fetching data:", error);
  } finally {
    isLoading.value = false; // 2. Turn off loading screen when done
  }
}

async function queryData() {
  const { data } = await supabase.from("strength").select();
  strengthExcercises.value = data;
}

// async function getCardio() {
//   const { data } = await supabase.from("cardio").select();
//   cardioExcercises.value = data;
// }

onMounted(() => {
  fetchEntries();
});
</script>

<template>
  <div
    class="grid grid-cols-6 gap-4 max-w-4/5 mt-16 px-4 py-4 mx-auto font-sans"
  >
    <div class="col-span-2 w-full p-4">
      <QuickActionForm />
    </div>
    <div
      class="col-span-4 w-full border-gray-100/10 border-1 p-4 border-rounded-lg"
    >
      <h2
        class="border-rounded-full w-max px-3 py-2 hover:bg-gray-400/30 transition-all duration-300 flex items-center gap-2 font-bold cursor-pointer font-sans text-base"
      >
        <div class="i-tabler:layout-grid" />
        Today workouts
      </h2>
      <ul class="grid-cols-3 mt-4">
        <li
          v-for="items in strengthExcercises"
          :key="items.id"
          class="bg-stone-700/30 hover:bg-stone-500/30 duration-200 w-1/3 border-rounded-md cursor-pointer p-4"
        >
          <h3 class="font-bold flex items-center gap-2 font-sans text-base">
            <div class="i-mdi:dumbbell" />
            {{ items.excercise }}
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
      </ul>
    </div>
  </div>
</template>
