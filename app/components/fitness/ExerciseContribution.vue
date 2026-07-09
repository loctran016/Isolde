<script setup lang="ts">
import { parseDateTime, today } from '@internationalized/date'
import type { MuscleGroup, StrengthRecord } from '~/types/database.types'

const props = withDefaults(
  defineProps<{
    muscles: MuscleGroup[]
    strengthExercises: StrengthRecord[]
    todayDate: string
    days?: number
  }>(),
  { days: 30 },
)

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

interface Row {
  exercise: string
  sets: number
  lastLoggedLabel: string
  lastLoggedDaysAgo: number
  trendPercent: number | null
}

const rows = computed<Row[]>(() => {
  if (!props.muscles.length) return []

  const cutoff = today(TIME_ZONE).subtract({ days: props.days })
  const todayCal = today(TIME_ZONE)

  const byExercise = new Map<
    string,
    { date: ReturnType<typeof parseDateTime>; oneRepMax: number; setCount: number }[]
  >()

  for (const item of props.strengthExercises) {
    if (!item?.date || !item.muscles?.some((m) => props.muscles.includes(m))) continue
    const d = parseDateTime(item.date)
    if (d.compare(cutoff) < 0) continue

    if (!byExercise.has(item.exercise)) byExercise.set(item.exercise, [])
    byExercise.get(item.exercise)!.push({
      date: d,
      oneRepMax: item.one_rep_max ?? 0,
      setCount: item.sets?.length ?? 0,
    })
  }

  const result: Row[] = []
  for (const [exercise, entries] of byExercise) {
    entries.sort((a, b) => a.date.compare(b.date))
    const totalSets = entries.reduce((sum, e) => sum + e.setCount, 0)
    const latest = entries[entries.length - 1]
    const daysAgo = todayCal.compare(latest.date)

    let trendPercent: number | null = null
    if (entries.length >= 2) {
      const first = entries[0]
      if (first.oneRepMax > 0) {
        trendPercent = Math.round(((latest.oneRepMax - first.oneRepMax) / first.oneRepMax) * 100)
      }
    }

    result.push({
      exercise,
      sets: totalSets,
      lastLoggedLabel:
        daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
      lastLoggedDaysAgo: daysAgo,
      trendPercent,
    })
  }

  return result.sort((a, b) => a.lastLoggedDaysAgo - b.lastLoggedDaysAgo)
})
</script>

<template>
  <p v-if="!muscles.length" class="text-sm opacity-60 py-8 text-center">
    Click a muscle on the diagram (or pick one from the dropdown) to see which exercises trained it.
  </p>
  <p v-else-if="!rows.length" class="text-sm opacity-60 py-8 text-center">
    No {{ muscles.join(' / ') }} sets logged in the last {{ days }} days.
  </p>
  <table v-else class="w-full text-sm">
    <thead>
      <tr class="text-left opacity-60 text-xs uppercase tracking-wide">
        <th class="font-medium pb-2">Exercise</th>
        <th class="font-medium pb-2 text-right">Sets ({{ days }}d)</th>
        <th class="font-medium pb-2 text-right">Last logged</th>
        <th class="font-medium pb-2 text-right">Trend</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in rows"
        :key="row.exercise"
        class="border-t border-stone-800/10 dark:border-stone-100/10"
      >
        <td class="py-2">{{ row.exercise }}</td>
        <td class="py-2 text-right tabular-nums">{{ row.sets }}</td>
        <td class="py-2 text-right opacity-70">{{ row.lastLoggedLabel }}</td>
        <td class="py-2 text-right tabular-nums">
          <span v-if="row.trendPercent === null" class="opacity-40">—</span>
          <span v-else-if="row.trendPercent > 1" class="text-emerald-600 dark:text-emerald-400">
            📈 +{{ row.trendPercent }}%
          </span>
          <span v-else-if="row.trendPercent < -1" class="text-red-600 dark:text-red-400">
            📉 {{ row.trendPercent }}%
          </span>
          <span v-else class="opacity-60">➡️ Stable</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
