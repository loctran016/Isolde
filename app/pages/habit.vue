<script setup lang="ts">
import { today } from '@internationalized/date'
import { usePreferredDark } from '@vueuse/core'

definePageMeta({ title: 'Habit Island', titleIcon: 'i-solar:star-rainbow-bold' })

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
const walkCounts = computed(() => countsFor(['walk']))
const pennywortCounts = computed(() => countsFor(['pennywort']))

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
</script>
<template>
  <div class="grid grid-cols-2 gap-4 px-4 py-4 mx-auto font-sans dark:text-gray-100">
    <!-- Skincare: AM + PM, full width -->
    <div class="col-span-2 card">
      <h2 class="card-title">
        <div class="i-solar:leaf-bold" />
        Skincare
      </h2>
      <p class="text-xs opacity-60 mt-1">Daily routine · morning &amp; evening</p>

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

      <HabitHeatmap
        class="mt-4"
        :logs-by-date="skincareCounts"
        :max-value="2"
        color="#a855f7"
        :is-dark="isDark"
      />
    </div>

    <!-- Walk -->
    <div class="card">
      <h2 class="card-title">
        <div class="i-solar:walking-round-bold" />
        Walk
      </h2>
      <p class="text-xs opacity-60 mt-1">Weekly</p>

      <button
        type="button"
        class="w-full mt-4 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50"
        :class="
          isLoggedToday('walk')
            ? 'bg-pink-500/20 border-pink-400/50 text-pink-700 dark:text-pink-300'
            : 'border-stone-800/20 dark:border-stone-100/20 hover:border-pink-400/50'
        "
        :disabled="pending.walk"
        @click="toggleHabit('walk')"
      >
        {{ isLoggedToday('walk') ? 'Walked today ✓' : 'Log walk' }}
      </button>

      <HabitHeatmap
        class="mt-4"
        :logs-by-date="walkCounts"
        :max-value="1"
        color="#ec4899"
        :is-dark="isDark"
      />
    </div>

    <!-- Pennywort -->
    <div class="card">
      <h2 class="card-title">
        <div class="i-solar:cup-bold" />
        Pennywort
      </h2>
      <p class="text-xs opacity-60 mt-1">Weekly</p>

      <button
        type="button"
        class="w-full mt-4 rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors cursor-pointer disabled:opacity-50"
        :class="
          isLoggedToday('pennywort')
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-700 dark:text-emerald-300'
            : 'border-stone-800/20 dark:border-stone-100/20 hover:border-emerald-400/50'
        "
        :disabled="pending.pennywort"
        @click="toggleHabit('pennywort')"
      >
        {{ isLoggedToday('pennywort') ? 'Had it today ✓' : 'Log drink' }}
      </button>

      <HabitHeatmap
        class="mt-4"
        :logs-by-date="pennywortCounts"
        :max-value="1"
        color="#10b981"
        :is-dark="isDark"
      />
    </div>
  </div>
</template>
