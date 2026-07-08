<script setup>
import { parseDateTime, today, parseDate } from '@internationalized/date'
import { EXERCISE_TO_SPLIT } from '~/types/database.types'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
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
watch(themePref)
// TODO: Should I use watchEffect
const colorMode = computed(() => themePref.value)

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

// --- Year selector for the heatmap ---

// derive year from the pinned todayDate instead of calling today() again
const todayYear = computed(() => parseDate(todayDate.value).year)

// ✅ Correct
const selectedYear = ref(null)
onMounted(() => {
  selectedYear.value = todayYear.value
})
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

const splitOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} sets ({d}%)' },
  legend: {
    bottom: 0,
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { fontSize: 11, color: colorMode.value === 'dark' || window.matchMedia('(prefers-color-scheme: dark)') ? '#e7e5e4' : '#44403c' },
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
}))
</script>

<template>
  <div class="grid lg:grid-cols-6 gap-4 px-4 py-4 mx-auto font-sans dark:text-gray-100">
    <!-- <WeeklySplit class="lg:col-span-6 card" /> -->
    <div class="lg:col-span-4 card">
      <h2 class="card-title">
        <div class="i-healthicons:exercise-weights text-lg" />
        Today workouts
      </h2>
      <ul class="grid grid-cols-2 lg:grid-cols-3 items-stretch w-full gap-2 mt-4">
        <ExerciseCard
          v-for="items in todayStrengthExercises"
          :key="items.id"
          :exercise="items"
          variant="today"
        />
        <StrengthForm>
          <li
            v-if="todayStrengthExercises.length < 3"
            class="border-stone-900/30 hover:border-stone-900/50 dark:border-stone-100/20 dark:hover:border-white/40 border-1 border-dashed flex items-center justify-center duration-200 w-full border-rounded-md cursor-pointer p-4 min-h-36 hover:text-black dark:hover:text-white"
          >
            <div class="i-mdi:plus" /></li
        ></StrengthForm>
      </ul>
    </div>
    <div class="lg:col-span-2 card"></div>

    <!-- Full-width yearly heatmap -->
    <div class="lg:col-span-6 card" ref="heatmapCardRef">
      <div class="flex items-center justify-between mb-2">
        <h2 class="card-title">
          <div class="i-solar:fire-bold text-xl" />
          Workout calendar
        </h2>
        <SelectRoot
          :model-value="String(selectedYear)"
          @update:model-value="(v) => (selectedYear = Number(v))"
        >
          <SelectTrigger
            class="inline-flex h-9 items-center justify-between gap-2 rounded-xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/10 backdrop-blur-xl backdrop-saturate-150 px-3 text-sm text-stone-900 dark:text-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 transition-colors"
          >
            <SelectValue />
            <SelectIcon>
              <div class="i-tabler-chevron-down h-4 w-4 text-stone-600 dark:text-gray-300" />
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent
              position="popper"
              :side-offset="4"
              class="z-30 overflow-hidden rounded-xl border border-white/40 dark:border-white/10 bg-white/45 dark:bg-stone-800/50 backdrop-blur-xl backdrop-saturate-150 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px]"
            >
              <SelectViewport class="p-1">
                <SelectItem
                  v-for="y in availableYears"
                  :key="y"
                  :value="String(y)"
                  class="relative flex h-9 items-center rounded-md pl-8 pr-4 text-sm cursor-pointer outline-none data-[highlighted]:bg-purple-400/20 dark:data-[highlighted]:bg-purple-500/20 transition-colors"
                >
                  <SelectItemIndicator
                    class="absolute left-2 inline-flex items-center justify-center text-purple-600 dark:text-purple-400"
                  >
                    <div class="i-mdi-check h-4 w-4" />
                  </SelectItemIndicator>
                  <SelectItemText class="text-stone-900 dark:text-gray-100">{{ y }}</SelectItemText>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>
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

    <!-- All Workouts -->

    <div class="lg:col-span-6 card">
      <h2 class="card-title">
        <div class="i-tabler:layout-grid" />
        Strength Workouts
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
