<script setup lang="ts">
import { createColumnHelper } from '@tanstack/vue-table'
import { h } from 'vue'
import type { StrengthRecord } from '~/types/database.types'

definePageMeta({ title: 'Body Island', titleIcon: 'i-mdi:weight-lifter' })
useHead({
  title: 'Body Island',
  meta: [{ name: 'description', content: 'Activity and metric logs.' }],
})
const supabase = useSupabaseClient()
const { themePref } = useTheme()
const colorMode = computed(() => themePref.value)
const isDark = computed(
  () =>
    colorMode.value === 'dark' ||
    (colorMode.value === 'system' &&
      import.meta.client &&
      window.matchMedia('(prefers-color-scheme: dark)').matches),
)

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString()
}

// --- Strength ---
const { data: strengthRows } = await useAsyncData('strength-entries', async () => {
  const { data, error } = await supabase
    .from('strength')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as StrengthRecord[]
})

const strengthHelper = createColumnHelper<StrengthRecord>()
const strengthColumns = [
  strengthHelper.accessor('id', { header: 'ID' }),
  strengthHelper.accessor('exercise', { header: 'Exercise' }),
  strengthHelper.accessor('date', { header: 'Date', cell: (i) => fmtDate(i.getValue()) }),
  strengthHelper.accessor('sets', {
    header: 'Sets',
    cell: (i) =>
      i
        .getValue()
        .map(([reps, kg]) => `${reps}×${kg}kg`)
        .join(', '),
  }),
  strengthHelper.accessor('muscles', { header: 'Muscles', cell: (i) => i.getValue().join(', ') }),
  strengthHelper.accessor('one_rep_max', { header: 'Est. 1RM' }),
  strengthHelper.accessor('total_volume', { header: 'Volume' }),
  //   strengthHelper.accessor('created_at', {
  //     header: 'Logged At',
  //     cell: (i) => fmtDate(i.getValue()),
  //   }),
]

// --- Cardio ---
interface CardioRecord {
  id: number
  exercise: string
  duration: number
  distance: number | null
  created_at: string
}

const { data: cardioRows } = await useAsyncData('cardio-entries', async () => {
  const { data, error } = await supabase
    .from('cardio')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CardioRecord[]
})

const cardioHelper = createColumnHelper<CardioRecord>()
const cardioColumns = [
  cardioHelper.accessor('id', { header: 'ID' }),
  cardioHelper.accessor('exercise', { header: 'Activity' }),
  cardioHelper.accessor('duration', { header: 'Duration (min)' }),
  cardioHelper.accessor('distance', { header: 'Distance (km)', cell: (i) => i.getValue() ?? '—' }),
  cardioHelper.accessor('created_at', { header: 'Logged At', cell: (i) => fmtDate(i.getValue()) }),
]

// --- Body metrics ---
interface BodyMetricRecord {
  id: number
  weight: number
  height: number
  neck: number
  waist: number
  bf: number
  created_at: string
}

const { data: bodyMetricRows } = await useAsyncData('body-metrics-history', async () => {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as BodyMetricRecord[]
})

const bodyMetricHelper = createColumnHelper<BodyMetricRecord>()
const bodyMetricColumns = [
  bodyMetricHelper.accessor('id', { header: 'ID' }),
  bodyMetricHelper.accessor('weight', { header: 'Weight (kg)' }),
  bodyMetricHelper.accessor('height', { header: 'Height (cm)' }),
  bodyMetricHelper.accessor('neck', { header: 'Neck (cm)' }),
  bodyMetricHelper.accessor('waist', { header: 'Waist (cm)' }),
  bodyMetricHelper.accessor('bf', { header: 'BF %' }),
  bodyMetricHelper.accessor('created_at', {
    header: 'Logged At',
    cell: (i) => fmtDate(i.getValue()),
  }),
]

// --- Cardio chart: duration over time per activity ---
const cardioChartOption = computed(() => {
  const textColor = isDark.value ? '#e7e5e4' : '#44403c'
  const rows = [...(cardioRows.value ?? [])].reverse()

  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: textColor } },
    grid: { left: 45, right: 20, top: 20, bottom: 36 },
    xAxis: {
      type: 'category',
      data: rows.map((r) => new Date(r.created_at).toLocaleDateString()),
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: textColor } },
    },
    yAxis: {
      type: 'value',
      name: 'Duration (min)',
      axisLabel: { color: textColor },
      nameTextStyle: { color: textColor },
      splitLine: { lineStyle: { opacity: 0.1 } },
    },
    series: [
      {
        name: 'Duration',
        type: 'line',
        data: rows.map((r) => r.duration),
        smooth: true,
        itemStyle: { color: '#a855f7' },
        lineStyle: { color: '#a855f7' },
      },
    ],
  }
})
</script>

<template>
  <div class="grid lg:grid-cols-2 gap-4 px-4 py-4 mx-auto font-sans dark:text-gray-100">
    <div class="card">
      <h2 class="card-title !text-base mb-2">Cardio duration</h2>
      <ClientOnly>
        <VChart :option="cardioChartOption" autoresize class="h-56 w-full" />
        <template #fallback>
          <div class="h-56 flex items-center justify-center text-sm opacity-50">Loading…</div>
        </template>
      </ClientOnly>
    </div>

    <div class="card flex flex-col">
      <h2 class="card-title !text-base mb-2">Weight & BF</h2>
      <BodyMetricsChart :is-dark="isDark" class="flex-1 min-h-0" />
    </div>

    <div class="card col-span-2">
      <h2 class="card-title mb-3">Strength log</h2>
      <LazyDataTable
        :data="strengthRows ?? []"
        :columns="strengthColumns"
        search-placeholder="Filter exercise, muscle…"
        hydrate-on-visible
      />
    </div>

    <div class="card col-span-2">
      <h2 class="card-title mb-3">Cardio log</h2>
      <LazyDataTable
        :data="cardioRows ?? []"
        :columns="cardioColumns"
        search-placeholder="Filter activity…"
        hydrate-on-visible
      />
    </div>

    <div class="card col-span-2">
      <h2 class="card-title mb-3">Body metrics log</h2>
      <LazyDataTable
        :data="bodyMetricRows ?? []"
        :columns="bodyMetricColumns"
        search-placeholder="Filter…"
        hydrate-on-visible
      />
    </div>
  </div>
</template>
