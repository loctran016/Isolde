<script setup lang="ts">
import { today, parseDate } from '@internationalized/date'
import { usePreferredDark } from '@vueuse/core'

const island = getIsland('/habit')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const supabase = useSupabaseClient()

const { themePref } = useTheme()
const colorMode = computed(() => themePref.value)
const prefersDark = usePreferredDark()
const isDark = computed(
  () => colorMode.value === 'dark' || (colorMode.value === 'system' && prefersDark.value),
)

interface HabitLog {
  id: number
  habit_key: string
  date: string
}

const { data: logs, refresh: refreshLogs } = await useAsyncData('habit-logs', async () => {
  const { data, error } = await supabase.from('habit_logs').select('id, habit_key, date')
  if (error) throw error
  return (data ?? []) as HabitLog[]
})

const todayIso = useState('habit-today', () => today(TIME_ZONE).toString())

const logIndex = computed(() => {
  const map: Record<string, Record<string, number>> = {}
  for (const log of logs.value ?? []) {
    if (!map[log.habit_key]) map[log.habit_key] = {}
    map[log.habit_key][log.date] = log.id
  }
  return map
})

function countsFor(keys: string[]) {
  const counts: Record<string, number> = {}
  for (const key of keys) {
    for (const iso of Object.keys(logIndex.value[key] ?? {})) {
      counts[iso] = (counts[iso] ?? 0) + 1
    }
  }
  return counts
}

const skincareCounts = computed(() => countsFor(['skincare_am', 'skincare_pm']))
const pennywortCounts = computed(() => countsFor(['pennywort']))
const pianoCounts = computed(() => countsFor(['piano']))

const isLoggedToday = (key: string) => Boolean(logIndex.value[key]?.[todayIso.value])
const pending = ref<Record<string, boolean>>({})

async function toggleHabit(key: string) {
  if (pending.value[key]) return
  pending.value[key] = true

  try {
    const existingId = logIndex.value[key]?.[todayIso.value]
    if (existingId) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', existingId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .insert({ habit_key: key, date: todayIso.value })
      if (error) throw error
    }
    await refreshLogs()
  } catch (e) {
    console.error('Failed to toggle habit', key, e)
  } finally {
    pending.value[key] = false
  }
}

// --- Streak calculations ---

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a))
  const todayStr = todayIso.value
  const todayDate = parseDate(todayStr)

  let streak = 0
  let currentDate = todayDate

  if (!sortedDates.includes(todayStr)) {
    currentDate = currentDate.subtract({ days: 1 })
  }

  while (true) {
    const iso = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}-${String(currentDate.day).padStart(2, '0')}`
    if (sortedDates.includes(iso)) {
      streak++
      currentDate = currentDate.subtract({ days: 1 })
    } else {
      break
    }
  }

  return streak
}

// --- Stats for side cards ---

const pianoCompletedDates = computed(() => {
  return Object.keys(pianoCounts.value).filter((iso) => pianoCounts.value[iso] > 0)
})

// Each piano session = 15 minutes
const PIANO_SESSION_MINUTES = 15

const pianoTotalMinutes = computed(() => pianoCompletedDates.value.length * PIANO_SESSION_MINUTES)

const pianoTotalHours = computed(() => {
  const hours = Math.floor(pianoTotalMinutes.value / 60)
  const minutes = pianoTotalMinutes.value % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
})

const pennywortThisWeek = computed(() => {
  const todayDate = parseDate(todayIso.value)
  const dayOfWeek = todayDate.toDate(TIME_ZONE).getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  let monday = todayDate.subtract({ days: mondayOffset })

  let count = 0
  for (let i = 0; i < 7; i++) {
    const iso = `${monday.year}-${String(monday.month).padStart(2, '0')}-${String(monday.day).padStart(2, '0')}`
    if (pennywortCounts.value[iso] > 0) count++
    monday = monday.add({ days: 1 })
  }
  return count
})

const pennywortTotalDays = computed(() => {
  return Object.keys(pennywortCounts.value).filter((iso) => pennywortCounts.value[iso] > 0).length
})

// --- Sugar Detox Challenge ---

const sugarDetoxCounts = computed(() =>
  countsFor(['sugar_detox_clean', 'sugar_detox_slip', 'sugar_detox_cheat']),
)

// Get all sugar detox dates
const sugarDetoxDates = computed(() => {
  const allDates = new Set<string>()
  for (const key of ['sugar_detox_clean', 'sugar_detox_slip', 'sugar_detox_cheat']) {
    for (const iso of Object.keys(logIndex.value[key] ?? {})) {
      allDates.add(iso)
    }
  }
  return [...allDates].sort((a, b) => b.localeCompare(a))
})

// Get today's status
const sugarDetoxTodayStatus = computed(() => {
  if (isLoggedToday('sugar_detox_clean')) return 'clean'
  if (isLoggedToday('sugar_detox_slip')) return 'slip'
  if (isLoggedToday('sugar_detox_cheat')) return 'cheat'
  return null
})

// Current streak (consecutive clean days)
const sugarDetoxStreak = computed(() => {
  const dates = sugarDetoxDates.value
  if (dates.length === 0) return 0

  const todayStr = todayIso.value
  const todayDate = parseDate(todayStr)

  let streak = 0
  let currentDate = todayDate

  // If today wasn't clean, start from yesterday
  if (!logIndex.value['sugar_detox_clean']?.[todayStr]) {
    currentDate = currentDate.subtract({ days: 1 })
  }

  while (true) {
    const iso = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}-${String(currentDate.day).padStart(2, '0')}`
    if (logIndex.value['sugar_detox_clean']?.[iso]) {
      streak++
      currentDate = currentDate.subtract({ days: 1 })
    } else {
      break
    }
  }

  return streak
})

// Total clean days
const sugarDetoxCleanDays = computed(() => {
  return Object.keys(logIndex.value['sugar_detox_clean'] ?? {}).length
})

// Days in challenge (from first log to today)
const sugarDetoxDayNumber = computed(() => {
  const dates = sugarDetoxDates.value
  if (dates.length === 0) return 0

  const firstDate = parseDate(dates[dates.length - 1])
  const todayDate = parseDate(todayIso.value)
  const diff = todayDate.compare(firstDate)
  return diff + 1
})

// Money saved (assuming $1 per clean day, you can adjust)
const SAVINGS_PER_CLEAN_DAY = 1
const sugarDetoxMoneySaved = computed(() => sugarDetoxCleanDays.value * SAVINGS_PER_CLEAN_DAY)

// Log sugar detox day
async function logSugarDetox(status: 'clean' | 'slip' | 'cheat') {
  const key = `sugar_detox_${status}`

  // Remove any existing status for today
  for (const existingKey of ['sugar_detox_clean', 'sugar_detox_slip', 'sugar_detox_cheat']) {
    const existingId = logIndex.value[existingKey]?.[todayIso.value]
    if (existingId) {
      await supabase.from('habit_logs').delete().eq('id', existingId)
    }
  }

  // Insert new status
  const { error } = await supabase
    .from('habit_logs')
    .insert({ habit_key: key, date: todayIso.value })

  if (!error) {
    await refreshLogs()
  }
}

// --- Sugar Detox Weekly Breakdown ---

interface WeekData {
  label: string
  days: Array<{
    date: string
    status: 'clean' | 'slip' | 'cheat' | 'future' | 'today'
    dayLabel: string
  }>
  cleanCount: number
  slipCount: number
  cheatCount: number
  summary: string
}
const sugarDetoxWeeks = computed(() => {
  const todayDate = parseDate(todayIso.value)
  const weeks: WeekData[] = []

  // Calculate challenge start: either first log or 21 days ago from today
  let challengeStart: any
  const allDates = sugarDetoxDates.value
  if (allDates.length > 0) {
    challengeStart = parseDate(allDates[allDates.length - 1])
  } else {
    challengeStart = todayDate.subtract({ days: 20 })
  }

  // Generate exactly 3 weeks
  for (let weekNum = 0; weekNum < 3; weekNum++) {
    const weekStart = challengeStart.add({ days: weekNum * 7 })
    const days: WeekData['days'] = []
    let cleanCount = 0
    let slipCount = 0
    let cheatCount = 0

    for (let dayNum = 0; dayNum < 7; dayNum++) {
      const date = weekStart.add({ days: dayNum })
      const iso = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`

      const comparison = date.compare(todayDate)

      if (comparison > 0) {
        // Future day
        days.push({ date: iso, status: 'future', dayLabel: '' })
      } else if (comparison === 0) {
        // Today - show current status or "today" if not logged
        const status = sugarDetoxTodayStatus.value || 'today'
        days.push({ date: iso, status, dayLabel: 'Today' })
        if (status === 'clean') cleanCount++
        else if (status === 'slip') slipCount++
        else if (status === 'cheat') cheatCount++
      } else {
        // Past day - check actual logs
        if (logIndex.value['sugar_detox_clean']?.[iso]) {
          days.push({ date: iso, status: 'clean', dayLabel: '' })
          cleanCount++
        } else if (logIndex.value['sugar_detox_slip']?.[iso]) {
          days.push({ date: iso, status: 'slip', dayLabel: '' })
          slipCount++
        } else if (logIndex.value['sugar_detox_cheat']?.[iso]) {
          days.push({ date: iso, status: 'cheat', dayLabel: '' })
          cheatCount++
        } else {
          // Before challenge started = future from challenge perspective
          days.push({ date: iso, status: 'future', dayLabel: '' })
        }
      }
    }

    const weekLabels = ['Week 1', 'Week 2', 'Week 3']

    weeks.push({
      label: weekLabels[weekNum],
      days,
      cleanCount,
      slipCount,
      cheatCount,
      summary: '', // We removed the summary text - let the blocks speak for themselves
    })
  }

  return weeks
})

function getDayAbbr(dateStr: string) {
  const calDate = parseDate(dateStr)
  const jsDate = calDate.toDate(TIME_ZONE)
  return jsDate.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
}
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 sm:gap-4 sm:px-4 sm:py-4 my-2 mx-auto font-sans dark:text-gray-100"
  >
    <!-- Skincare: AM + PM, full width -->
    <div class="col-span-full card">
      <div class="flex items-center justify-between">
        <h2 class="card-title">
          <div class="i-mdi:face-man-shimmer" />
          Skincare
        </h2>
        <span class="text-xs opacity-60">AM & PM routine</span>
      </div>

      <div class="flex gap-2 mt-4">
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50"
          :class="
            isLoggedToday('skincare_am')
              ? 'bg-purple-500/20 border-purple-400/50 text-purple-700 dark:text-purple-300'
              : 'border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50'
          "
          :disabled="pending.skincare_am"
          @click="toggleHabit('skincare_am')"
        >
          Morning {{ isLoggedToday('skincare_am') ? '✓' : '' }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50"
          :class="
            isLoggedToday('skincare_pm')
              ? 'bg-purple-500/20 border-purple-400/50 text-purple-700 dark:text-purple-300'
              : 'border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50'
          "
          :disabled="pending.skincare_pm"
          @click="toggleHabit('skincare_pm')"
        >
          Evening {{ isLoggedToday('skincare_pm') ? '✓' : '' }}
        </button>
      </div>

      <div class="overflow-x-auto scrollbar-none">
        <CalendarHeatmap
          class="mt-6 min-w-144 w-full"
          :logs-by-date="skincareCounts"
          :max-value="2"
          color="#a855f7"
          :is-dark="isDark"
          height="h-50"
        />
      </div>
    </div>
    <!-- Sugar Detox Challenge -->
    <div class="col-span-full card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title">
          <div class="i-solar:candy-bold-duotone" />
          Sugar Detox
        </h2>
        <div class="flex items-center gap-4 text-sm">
          <span class="opacity-70"
            >Day <b>{{ sugarDetoxDayNumber }}</b> of 21</span
          >
          <span class="text-pink-400">
            <span class="i-solar:fire-bold-duotone inline-block align-middle mr-1" />
            Streak: {{ sugarDetoxStreak }}
          </span>
        </div>
      </div>

      <!-- 2-column layout: Weekly Breakdown | Control Panel -->
      <div class="grid grid-cols-12 gap-6 items-center">
        <!-- LEFT: Weekly Breakdown (6/12 columns) -->
        <div class="col-span-6 flex flex-col gap-5 pr-4">
          <div class="flex items-center gap-2 text-sm opacity-60 mb-1">
            <div class="i-solar:chart-2-bold-duotone text-pink-400 text-lg" />
            Weekly Breakdown
          </div>

          <!-- Week rows -->
          <div v-for="week in sugarDetoxWeeks" :key="week.label" class="flex items-center gap-4">
            <span class="text-xs opacity-40 w-12 shrink-0">{{ week.label }}</span>
            <div class="flex gap-2 flex-1">
              <div
                v-for="day in week.days"
                :key="day.date"
                class="flex-1 aspect-square rounded-md transition-all"
                :class="{
                  'bg-pink-500 shadow-lg shadow-pink-500/20': day.status === 'clean',
                  'bg-purple-500 shadow-lg shadow-purple-500/20': day.status === 'slip',
                  'bg-stone-400/80 dark:bg-stone-600/80': day.status === 'cheat',
                  'bg-transparent border border-stone-200/30 dark:border-white/5':
                    day.status === 'future',
                  'bg-pink-400/80 ring-2 ring-pink-400/60 ring-offset-1 ring-offset-white dark:ring-offset-stone-900 shadow-lg shadow-pink-500/30':
                    day.status === 'today',
                }"
                :title="`${getDayAbbr(day.date)}: ${day.status}`"
              />
            </div>
          </div>
        </div>

        <!-- RIGHT: Control Panel (6/12 columns) -->
        <div
          class="col-span-6 flex flex-col items-stretch justify-center gap-4 pl-4 border-l border-stone-200/20 dark:border-white/5 h-full"
        >
          <p class="text-xs opacity-50 tracking-wider uppercase">Log today</p>

          <!-- Clean button - wide and chunky -->
          <button
            type="button"
            class="flex items-center justify-center gap-3 w-full py-4 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg font-medium"
            :class="
              sugarDetoxTodayStatus === 'clean'
                ? 'bg-pink-500/20 border-pink-400/40 ring-1 ring-pink-400/20 text-pink-400'
                : 'bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20 hover:border-pink-500/30 text-white/90'
            "
            :disabled="!!sugarDetoxTodayStatus"
            @click="logSugarDetox('clean')"
          >
            <div class="i-solar:star-bold-duotone text-pink-400 text-xl w-6 h-6 shrink-0" />
            Clean
          </button>

          <!-- Slip button -->
          <button
            type="button"
            class="flex items-center justify-center gap-3 w-full py-4 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg font-medium"
            :class="
              sugarDetoxTodayStatus === 'slip'
                ? 'bg-purple-500/20 border-purple-400/40 ring-1 ring-purple-400/20 text-purple-400'
                : 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 text-white/90'
            "
            :disabled="!!sugarDetoxTodayStatus"
            @click="logSugarDetox('slip')"
          >
            <div class="i-solar:flame-bold-duotone text-purple-400 text-xl w-6 h-6 shrink-0" />
            Slip
          </button>

          <!-- Cheat button -->
          <button
            type="button"
            class="flex items-center justify-center gap-3 w-full py-4 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg font-medium"
            :class="
              sugarDetoxTodayStatus === 'cheat'
                ? 'bg-red-500/20 border-red-400/40 ring-1 ring-red-400/20 text-red-400'
                : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-white/70'
            "
            :disabled="!!sugarDetoxTodayStatus"
            @click="logSugarDetox('cheat')"
          >
            <div class="i-solar:close-circle-bold-duotone text-red-400 text-xl w-6 h-6 shrink-0" />
            Cheat
          </button>

          <!-- Subtle stats line at the bottom -->
          <p class="text-xs opacity-30 text-center mt-2">
            {{ sugarDetoxCleanDays }} clean · {{ sugarDetoxStreak }} day streak
          </p>
        </div>
      </div>
    </div>
    <!-- Piano -->
    <div class="card sm:col-span-3">
      <div class="flex items-center justify-between">
        <h2 class="card-title">
          <div class="i-solar:music-notes-bold" />
          Piano
        </h2>
        <span class="text-xs opacity-60">Daily practice</span>
      </div>

      <button
        type="button"
        class="w-full mt-4 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50"
        :class="
          isLoggedToday('piano')
            ? 'bg-purple-500/20 border-purple-400/50 text-purple-700 dark:text-purple-300'
            : 'border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50'
        "
        :disabled="pending.piano"
        @click="toggleHabit('piano')"
      >
        {{ isLoggedToday('piano') ? 'Practiced today ✓' : 'Log practice' }}
      </button>

      <div class="overflow-x-auto scrollbar-none">
        <CalendarHeatmap
          class="mt-6 min-w-144 w-full"
          :logs-by-date="pianoCounts"
          :max-value="1"
          color="#3b82f6"
          :is-dark="isDark"
          height="h-36"
        />
      </div>
    </div>

    <!-- Piano stats card -->
    <div class="card sm:col-span-1 !p-6 flex flex-col items-center justify-center gap-3">
      <div class="i-solar:piano-bold-duotone text-6xl opacity-80" />
      <span class="text-5xl font-bold">{{ pianoTotalHours }}</span>
      <div class="text-sm opacity-60">total practice</div>
    </div>

    <!-- Pennywort -->
    <div class="card sm:col-span-3">
      <div class="flex items-center justify-between">
        <h2 class="card-title">
          <div class="i-solar:leaf-bold" />
          Pennywort
        </h2>
        <span class="text-xs opacity-60">3x per week goal</span>
      </div>

      <button
        type="button"
        class="w-full mt-4 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50"
        :class="
          isLoggedToday('pennywort')
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-700 dark:text-emerald-300'
            : 'border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50'
        "
        :disabled="pending.pennywort"
        @click="toggleHabit('pennywort')"
      >
        {{ isLoggedToday('pennywort') ? 'Had it today ✓' : 'Log drink' }}
      </button>

      <div class="overflow-x-auto scrollbar-none">
        <CalendarHeatmap
          class="mt-6 min-w-144 w-full"
          :logs-by-date="pennywortCounts"
          :max-value="1"
          color="#10b981"
          :is-dark="isDark"
          height="h-36"
        />
      </div>
    </div>
    <!-- Pennywort stats card -->
    <div class="card sm:col-span-1 !p-6 flex flex-col items-center justify-center gap-3">
      <div class="i-solar:cup-bold-duotone text-6xl opacity-80" />
      <span class="text-5xl font-bold">{{ pennywortThisWeek }}/3</span>
      <div class="text-sm opacity-60">this week</div>
      <div class="text-xs opacity-40 mt-1">{{ pennywortTotalDays }} total days</div>
    </div>
  </div>
</template>
