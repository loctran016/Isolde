<script setup>
import { today, parseDate } from '@internationalized/date'
import { createColumnHelper, FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { MEDITATION_PRACTICES } from '~/data/meditationPractices'
import { getIsland } from '~/data/islands'

const island = getIsland('/meditate')

useHead({ title: island.pageTitle, meta: [{ name: 'description', content: island.description }] })
definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const supabase = useSupabaseClient()

const todayIso = useState('meditate-today', () => today(TIME_ZONE).toString())
const todayCalendarDate = computed(() => parseDate(todayIso.value))

const { data: logs, refresh: refreshLogs } = await useAsyncData(
  'meditation-logs',
  async () => {
    const { data, error } = await supabase
      .from('meditation_logs')
      .select('id, practice_key, date, count')
    if (error) throw error
    return data ?? []
  },
  { deep: false },
)

// practice_key -> { dateIso -> { id, count } }
const logIndex = computed(() => {
  const map = {}
  for (const log of logs.value ?? []) {
    if (!map[log.practice_key]) map[log.practice_key] = {}
    map[log.practice_key][log.date] = { id: log.id, count: log.count }
  }
  return map
})

const pending = ref({})

async function tapPractice(practice) {
  if (pending.value[practice.key]) return
  pending.value[practice.key] = true

  try {
    const existing = logIndex.value[practice.key]?.[todayIso.value]
    if (existing) {
      const { error } = await supabase
        .from('meditation_logs')
        .update({ count: existing.count + practice.stepValue })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('meditation_logs').insert({
        practice_key: practice.key,
        date: todayIso.value,
        count: practice.firstValue,
      })
      if (error) throw error
    }
    await refreshLogs()
  } catch (e) {
    console.error('Failed to log practice', practice.key, e)
  } finally {
    pending.value[practice.key] = false
  }
}

function todayCountFor(key) {
  return logIndex.value[key]?.[todayIso.value]?.count ?? 0
}

// --- Month/year selector for the table view below ---

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const selectedMonth = useState('meditate-month', () => todayCalendarDate.value.month)
const selectedYear = useState('meditate-year', () => todayCalendarDate.value.year)

const availableYears = computed(() => {
  const years = new Set([todayCalendarDate.value.year])
  for (const log of logs.value ?? []) {
    years.add(Number(log.date.slice(0, 4)))
  }
  return [...years].sort((a, b) => b - a)
})

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

const dayNumbers = computed(() =>
  Array.from({ length: daysInMonth(selectedYear.value, selectedMonth.value) }, (_, i) => i + 1),
)

function pad(n) {
  return String(n).padStart(2, '0')
}

function countForDay(practiceKey, day) {
  const iso = `${selectedYear.value}-${pad(selectedMonth.value)}-${pad(day)}`
  return logIndex.value[practiceKey]?.[iso]?.count ?? null
}

// --- Pivoted table: rows = practices, columns = days of the selected month ---

const tableData = computed(() =>
  MEDITATION_PRACTICES.map((practice) => {
    const row = { practice: practice.label, unit: practice.unit }
    for (const day of dayNumbers.value) {
      row[`d${day}`] = countForDay(practice.key, day)
    }
    return row
  }),
)

const columnHelper = createColumnHelper()

const tableColumns = computed(() => [
  columnHelper.accessor('practice', { header: 'Practice' }),
  columnHelper.accessor('unit', { header: 'Unit' }),
  ...dayNumbers.value.map((day) =>
    columnHelper.accessor(`d${day}`, {
      header: String(day),
      cell: (info) => {
        const value = info.getValue()
        return value == null ? h('span', { class: 'opacity-20' }, '—') : value
      },
    }),
  ),
])

const table = useVueTable({
  get data() {
    return tableData.value
  },
  get columns() {
    return tableColumns.value
  },
  getCoreRowModel: getCoreRowModel(),
})

const { exportToExcel } = useMeditationExport()

async function handleExport() {
  await exportToExcel({
    year: selectedYear.value,
    month: selectedMonth.value,
    monthLabel: MONTH_NAMES[selectedMonth.value - 1],
    dayNumbers: dayNumbers.value,
    countForDay,
  })
}
</script>

<template>
  <div
    class="my-2 grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 sm:py-4 mx-auto font-sans dark:text-gray-100"
  >
    <!-- Quick actions -->
    <div class="card col-span-full">
      <h2 class="card-title">
        <div class="i-solar:meditation-round-outline" />
        Today's practice
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
        <button
          v-for="practice in MEDITATION_PRACTICES"
          :key="practice.key"
          type="button"
          class="flex flex-col items-center gap-1 rounded-lg px-3 py-3 text-sm border border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50 hover:bg-purple-400/10 transition-colors cursor-pointer disabled:opacity-50"
          :disabled="pending[practice.key]"
          @click="tapPractice(practice)"
        >
          <span class="font-medium text-center">{{ practice.label }}</span>
          <span class="text-xs opacity-60">{{ practice.unit }}</span>
          <span class="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {{ todayCountFor(practice.key) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Month/year history -->
    <div class="card col-span-full">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h2 class="card-title">
          <div class="i-solar:calendar-linear" />
          History
        </h2>
        <ClientOnly>
          <div class="flex items-center gap-2">
            <Select
              :model-value="MONTH_NAMES[selectedMonth - 1]"
              @update:model-value="(v) => (selectedMonth = MONTH_NAMES.indexOf(v) + 1)"
              :options="MONTH_NAMES"
            />
            <Select
              :model-value="String(selectedYear)"
              @update:model-value="(v) => (selectedYear = Number(v))"
              :options="availableYears.map(String)"
            />
            <button
              type="button"
              class="p-2 rounded-lg border border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50 hover:bg-purple-400/10 transition-colors cursor-pointer"
              aria-label="Export to Excel"
              title="Export to Excel"
              @click="handleExport"
            >
              <div class="i-solar:file-download-outline text-lg" />
            </button>
          </div>
          <template #fallback>
            <div
              class="h-9 w-48 rounded-xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/10 animate-pulse"
            />
          </template>
        </ClientOnly>
      </div>

      <div class="overflow-x-auto scrollbar-none mt-4">
        <table class="text-sm border-collapse">
          <thead>
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="(header, i) in headerGroup.headers"
                :key="header.id"
                class="text-left px-2 py-2 font-medium text-xs uppercase tracking-wide opacity-60 whitespace-nowrap"
                :class="i === 0 ? 'sticky left-0 bg-inherit z-10' : ''"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="border-t border-stone-800/10 dark:border-stone-100/10"
            >
              <td
                v-for="(cell, i) in row.getVisibleCells()"
                :key="cell.id"
                class="px-2 py-2 whitespace-nowrap"
                :class="
                  i === 0 ? 'sticky left-0 bg-inherit z-10 font-medium' : 'text-center opacity-80'
                "
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
