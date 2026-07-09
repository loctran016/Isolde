<script setup>
import { parseDateTime, today, parseDate } from '@internationalized/date'
import { EXERCISE_TO_SPLIT, STRENGTH_EXERCISES } from '~/types/database.types'
useHead({
  title: 'Body Island',
  meta: [{ name: 'description', content: 'Activity and metric logs.' }],
})

definePageMeta({ title: 'Body Island' })

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

const heatmapCardRef = ref(null)
const echartsTextColor = ref('#000000')

function syncEchartsTextColor() {
  if (!heatmapCardRef.value) return
  echartsTextColor.value = getComputedStyle(heatmapCardRef.value).color
}

const { themePref } = useTheme()
const colorMode = computed(() => themePref.value)

// Shared by every ECharts option on this page. Safe here because it's
// only ever read inside <ClientOnly>-rendered chart options, or passed
// as a prop into a component that's itself only mounted client-side —
// never used to drive SSR'd DOM directly.
const isDark = computed(
  () =>
    colorMode.value === 'dark' ||
    (colorMode.value === 'system' &&
      import.meta.client &&
      window.matchMedia('(prefers-color-scheme: dark)').matches),
)

onMounted(syncEchartsTextColor)
watch(
  () => colorMode.value,
  () => nextTick(syncEchartsTextColor),
)

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

const selectedMuscleGroups = ref([])

// pins "today" to a single value shared between server render and client hydration
// store as ISO string ✅
const todayDate = useState('fitness-today', () => today(TIME_ZONE).toString())

// reconstruct CalendarDate for comparisons
const todayCalendarDate = computed(() => parseDate(todayDate.value))

const todayStrengthExercises = computed(() => {
  return (strengthExercises.value ?? []).filter((item) => {
    if (!item?.date) return false
    const itemDate = parseDateTime(item.date)
    return itemDate.compare(todayCalendarDate.value) === 0
  })
})

const WEEK_SCHEDULE = [
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

const todaySchedule = computed(() => {
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
    todayCalendarDate.value.toDate(TIME_ZONE),
  )
  return WEEK_SCHEDULE.find((d) => d.day === dayName) ?? null
})

// --- Overview stats: yearly heatmap, streak, push/pull split ---

// Precompute sets-per-day once, rather than re-filtering the whole
// dataset for every day of the year (365 x N vs a single N-pass).
const setsPerDayMap = computed(() => {
  const map = new Map()
  for (const item of strengthExercises.value ?? []) {
    if (!item?.date) continue
    const d = parseDateTime(item.date)
    const iso = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
    map.set(iso, (map.get(iso) ?? 0) + (item.sets?.length ?? 0))
  }
  return map
})

function setsLoggedOnIso(iso) {
  return setsPerDayMap.value.get(iso) ?? 0
}

function setsLoggedOn(calDate) {
  const iso = `${calDate.year}-${String(calDate.month).padStart(2, '0')}-${String(calDate.day).padStart(2, '0')}`
  return setsLoggedOnIso(iso)
}

const DAILY_GOAL = 15

// --- Selected Exercise Improvement ---

const selectedExercise = ref('DB Bench Press')
// const selectedExercise = ref<StrengthExercise | null>('Incline DB Bench Press')

// --- Year selector for the heatmap ---

// derive year from the pinned todayDate instead of calling today() again
const todayYear = computed(() => parseDate(todayDate.value).year)

const selectedYear = useState('fitness-selected-year', () => todayYear.value)

const availableYears = computed(() => {
  const years = new Set([todayYear.value]) // use pinned value
  for (const item of strengthExercises.value ?? []) {
    if (item?.date) years.add(parseDateTime(item.date).year)
  }
  return [...years].sort((a, b) => b - a)
})

const yearHeatmapData = computed(() => {
  const data = []
  const year = selectedYear.value
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  for (let d = start; d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    data.push([iso, setsLoggedOnIso(iso)])
  }
  return data
})

const maxDailySets = computed(() =>
  Math.max(DAILY_GOAL, ...yearHeatmapData.value.map(([, v]) => v)),
)

const heatmapOption = computed(() => {
  return {
    tooltip: {
      //   formatter: (params) => `${params.value[0]}: ${params.value[1]} sets`,
      formatter: (params) => `${formatIsoDateHeatmap(params.value[0])}: ${params.value[1]} sets`,
    },
    visualMap: {
      min: 0,
      max: maxDailySets.value,
      show: false, // hides the slider UI, mapping still applies to series colors
      inRange: { color: ['rgba(168,85,247,0.06)', '#a855f7', '#6b21a8'] },
    },
    calendar: {
      top: 40,
      left: 40,
      right: 20,
      bottom: 20, // was 40 — no slider to leave room for anymore
      cellSize: ['auto', 16],
      range: String(selectedYear.value),
      firstDay: 1,
      itemStyle: { borderWidth: 3, borderColor: 'transparent', color: 'transparent' },
      splitLine: { show: false },
      yearLabel: { show: false },
      monthLabel: { color: echartsTextColor.value },
      dayLabel: {
        color: echartsTextColor.value,
        nameMap: ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'],
      },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: yearHeatmapData.value,
      },
    ],
  }
})

const currentStreak = computed(() => {
  let streak = 0
  let cursor = todayCalendarDate.value
  if (setsLoggedOn(cursor) === 0) cursor = cursor.subtract({ days: 1 })
  while (setsLoggedOn(cursor) > 0) {
    streak++
    cursor = cursor.subtract({ days: 1 })
  }
  return streak
})

const RECENT_WINDOW_DAYS = 30

const splitTotals = computed(() => {
  const cutoff = todayCalendarDate.value.subtract({ days: RECENT_WINDOW_DAYS })
  let push = 0
  let pull = 0
  for (const item of strengthExercises.value ?? []) {
    if (!item?.date) continue
    const d = parseDateTime(item.date)
    if (d.compare(cutoff) < 0) continue
    const split = EXERCISE_TO_SPLIT[item.exercise]
    const setCount = item.sets?.length ?? 0
    if (split === 'Push') push += setCount
    else if (split === 'Pull') pull += setCount
  }
  return { push, pull }
})

function formatIsoDateHeatmap(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const hasSplitData = computed(() => splitTotals.value.push + splitTotals.value.pull > 0)

const splitOption = computed(() => {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} sets ({d}%)' },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11, color: isDark ? '#e7e5e4' : '#44403c' },
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '42%'],
        label: { show: false },
        data: [
          { value: splitTotals.value.pull, name: 'Pull', itemStyle: { color: '#a855f7' } },
          { value: splitTotals.value.push, name: 'Push', itemStyle: { color: '#ec4899' } },
        ],
      },
    ],
  }
})
</script>

<template>
  <div class="grid lg:grid-cols-6 gap-4 px-4 py-4 mx-auto font-sans dark:text-gray-100">
    <div class="lg:col-span-4 card">
      <div class="flex items-center justify-between">
        <h2 class="card-title">
          <div class="i-solar:graph-new-up-bold text-lg" />
          Improvements
        </h2>
        <Select v-model="selectedExercise" :options="STRENGTH_EXERCISES" />
      </div>
      <ExerciseProgressChart
        class="mt-4"
        :exercise="selectedExercise"
        :today-date="todayDate"
        :is-dark="isDark"
        :strength-exercises="strengthExercises"
      />
    </div>

    <div class="lg:col-span-2 card">
      <h2 class="card-title flex flex-col items-start gap-1">
        <template v-if="todaySchedule">
          {{ todaySchedule.day }}
          <span class="font-medium text-base opacity-80">{{ todaySchedule.label }}</span>
        </template>
        <template v-else>Today</template>
      </h2>

      <template v-if="todaySchedule">
        <!-- Rest / mobility day — show the note instead -->
        <p v-if="todaySchedule.note" class="text-sm opacity-70 mt-4 leading-relaxed">
          {{ todaySchedule.note }}
        </p>

        <!-- Workout day — list exercises, each opening StrengthForm preset to it -->
        <ul v-else-if="todaySchedule.exercises" class="mt-4 flex flex-col gap-1.5">
          <li v-for="ex in todaySchedule.exercises" :key="ex.canonical">
            <StrengthForm :preset-exercise="ex.canonical">
              <button
                type="button"
                class="w-full flex items-center justify-between gap-4 text-sm rounded-lg px-3 py-2.5 -mx-1 hover:bg-purple-400/15 dark:hover:bg-purple-500/15 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                @click="selectedExercise = ex.canonical"
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
                <span class="opacity-50 tabular-nums shrink-0 text-xs">{{ ex.detail }}</span>
              </button>
            </StrengthForm>
          </li>
        </ul>
      </template>
    </div>

    <!-- Full-width yearly heatmap -->
    <div class="lg:col-span-6 card" ref="heatmapCardRef">
      <div class="flex items-center justify-between mb-2">
        <h2 class="card-title">
          <div class="i-solar:fire-bold text-xl" />
          Workout calendar
        </h2>
        <Select
          :model-value="String(selectedYear)"
          @update:model-value="(v) => (selectedYear = Number(v))"
          :options="availableYears.map(String)"
        />
      </div>
      <ClientOnly>
        <VChart :option="heatmapOption" autoresize class="h-56 w-full" />
        <template #fallback>
          <div class="h-56 flex items-center justify-center text-sm">Loading…</div>
        </template>
      </ClientOnly>
      <p class="text-xs mt-1 opacity-85">Streak: {{ currentStreak }} days · sets logged per day</p>
    </div>

    <!-- Streak + split, side by side below -->

    <div class="lg:col-span-2 h-76 card">
      <h2 class="card-title !text-base mb-2">Weight & BF</h2>
    </div>

    <div class="lg:col-span-1 flex flex-col gap-4 text-gray-800 dark:text-gray-100">
      <StrengthForm>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded="false"
          data-state="closed"
          class="card h-36 flex items-center gap-2 justify-center w-full cursor-pointer group"
        >
          <div
            class="i-solar:dumbbell-large-minimalistic-line-duotone dark:i-solar:dumbbell-large-minimalistic-bold-duotone text-6xl"
          />
          <p
            class="text-4xl opacity-55 dark:opacity-15 transition-all duration-200 group-hover:opacity-100"
          >
            +
          </p>
        </button>
      </StrengthForm>
      <CardioForm>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded="false"
          data-state="closed"
          class="card h-36 flex items-center gap-2 justify-center w-full cursor-pointer group"
        >
          <div
            class="i-solar:treadmill-round-line-duotone dark:i-solar:treadmill-round-bold-duotone text-7xl"
          />
          <p
            class="text-4xl opacity-55 dark:opacity-15 transition-all duration-200 group-hover:opacity-100"
          >
            +
          </p>
        </button>
      </CardioForm>
    </div>
    <div class="lg:col-span-1 flex flex-col gap-4 text-gray-800 dark:text-gray-100">
      <BodyMetricForm>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded="false"
          data-state="closed"
          class="card h-36 flex items-center gap-2 justify-center w-full cursor-pointer group"
        >
          <div class="i-solar:weigher-line-duotone dark:i-solar:weigher-bold-duotone text-6xl" />
          <p
            class="text-4xl opacity-55 dark:opacity-15 transition-all duration-200 group-hover:opacity-100"
          >
            +
          </p>
        </button>
      </BodyMetricForm>
      <div class="card h-36 flex flex-col gap-1 items-center justify-center">
        <div class="text-5xl font-semibold flex items-center gap-1">
          <div class="i-solar:fire-line-duotone dark:i-solar:fire-bold-duotone text-6xl" />
          <span class="opacity-90 dark:opacity-100">{{ currentStreak }}</span>
        </div>
        <p class="text-base opacity-85">{{ currentStreak === 1 ? 'day' : 'days' }} active</p>
      </div>
    </div>

    <div class="lg:col-span-2 h-76 card">
      <h2 class="card-title !text-base mb-2">Push / Pull split</h2>
      <ClientOnly>
        <VChart v-if="hasSplitData" :option="splitOption" autoresize class="h-50 w-full" />
        <p v-else class="h-50 flex items-center justify-center text-sm text-center px-4">
          Log a few workouts to see your split.
        </p>
        <template #fallback>
          <div class="h-40 flex items-center justify-center text-sm opacity-50">Loading…</div>
        </template>
      </ClientOnly>
      <p class="text-xs mt-1 opacity-90">Last {{ RECENT_WINDOW_DAYS }} days, by sets logged</p>
    </div>

    <!-- Muscle diagram + table -->

    <div class="lg:col-span-3 xl:col-span-2 card">
      <h2 class="card-title">
        <div class="i-mdi:human" />
        Muscle Diagram
      </h2>
      <p class="text-xs opacity-60 mt-1">Last {{ RECENT_WINDOW_DAYS }} days, by sets logged</p>
      <MuscleHeatmap
        :days="RECENT_WINDOW_DAYS"
        :strength-exercises="strengthExercises ?? []"
        class="mt-4"
        @select="(groups) => (selectedMuscleGroups = groups)"
      />
    </div>

    <div class="lg:col-span-3 xl:col-span-4 card">
      <h2 class="card-title">
        <div class="i-solar:database-linear" />
        Muscle Table
      </h2>
      <p class="text-xs opacity-60 mt-1">
        Last {{ RECENT_WINDOW_DAYS }} days, select muscle group with the diagram
      </p>
      <ExerciseContribution
        :muscles="selectedMuscleGroups"
        :strength-exercises="strengthExercises ?? []"
        :today-date="todayDate"
        :days="RECENT_WINDOW_DAYS"
        class="mt-4"
      />
    </div>

    <!-- All Workouts -->

    <div class="lg:col-span-6 card">
      <h2 class="card-title">
        <div class="i-tabler:layout-grid" />
        Strength Workouts
        <NuxtLink
          to="/fitness/table"
          aria-label="Full Workout Table"
          title="Full Table"
          class="ml-auto"
          target="_blank"
        >
          <div
            class="i-solar:arrow-right-up-line-duotone dark:i-solar:arrow-right-up-bold-duotone text-2xl cursor-pointer"
          />
        </NuxtLink>
      </h2>
      <ul class="grid grid-cols-3 xl:grid-cols-4 items-stretch w-full gap-2 mt-4">
        <ExerciseCard
          v-for="items in strengthExercises"
          :key="items.id"
          :exercise="items"
          variant="all"
        />
        <StrengthForm>
          <li
            v-if="strengthExercises.length < 4"
            class="border-stone-100/30 hover:border-stone-100/50 dark:border-stone-100/20 dark:hover:border-white/40 border-1 border-dashed flex items-center justify-center duration-200 w-full border-rounded-md cursor-pointer p-4 min-h-36"
          >
            <div class="i-mdi:plus" /></li
        ></StrengthForm>
      </ul>
    </div>
  </div>
</template>
