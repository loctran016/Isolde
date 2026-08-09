<script setup>
import { h, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { today, parseDate } from '@internationalized/date'
import { createColumnHelper, FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { MEDITATION_PRACTICES } from '~/data/meditationPractices'
import { getIsland } from '~/data/islands'

const island = getIsland('/meditate')

useHead({ title: island.pageTitle, meta: [{ name: 'description', content: island.description }] })
definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const supabase = useSupabaseClient()

// Plain consts — no SSR/hydration mismatch risk, no reactive overhead
const todayIso = today(TIME_ZONE).toString()
const todayCalendarDate = parseDate(todayIso)

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

const logIndex = computed(() => {
  const map = {}
  for (const log of logs.value ?? []) {
    if (!map[log.practice_key]) map[log.practice_key] = {}
    map[log.practice_key][log.date] = { id: log.id, count: log.count }
  }
  return map
})

const pending = ref({})
const isEditDialogOpen = ref(false)
const selectedEditDate = ref(todayIso)
const editCounts = ref({})
const editSaving = ref(false)
const editError = ref('')

async function tapPractice(practice) {
  if (pending.value[practice.key]) return
  pending.value[practice.key] = true

  try {
    const existing = logIndex.value[practice.key]?.[todayIso]
    if (existing) {
      const { error } = await supabase
        .from('meditation_logs')
        .update({ count: existing.count + practice.stepValue })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('meditation_logs').insert({
        practice_key: practice.key,
        date: todayIso,
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
  return logIndex.value[key]?.[todayIso]?.count ?? 0
}

function hydrateEditCounts() {
  const next = {}
  for (const practice of MEDITATION_PRACTICES) {
    next[practice.key] = logIndex.value[practice.key]?.[selectedEditDate.value]?.count ?? 0
  }
  editCounts.value = next
}

watch([selectedEditDate, logs], hydrateEditCounts, { immediate: true })

watch(isEditDialogOpen, (open) => {
  if (!open) return
  editError.value = ''
  hydrateEditCounts()
})

async function saveEditLogs() {
  if (editSaving.value) return

  editError.value = ''
  editSaving.value = true

  try {
    const ops = []
    for (const practice of MEDITATION_PRACTICES) {
      const parsed = Number(editCounts.value[practice.key] ?? 0)
      const nextCount = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
      const existing = logIndex.value[practice.key]?.[selectedEditDate.value]

      if (existing) {
        if (nextCount <= 0) {
          ops.push(supabase.from('meditation_logs').delete().eq('id', existing.id))
        } else if (existing.count !== nextCount) {
          ops.push(supabase.from('meditation_logs').update({ count: nextCount }).eq('id', existing.id))
        }
      } else if (nextCount > 0) {
        ops.push(supabase.from('meditation_logs').insert({
          practice_key: practice.key,
          date: selectedEditDate.value,
          count: nextCount,
        }))
      }
    }

    if (ops.length) {
      const results = await Promise.all(ops)
      const failed = results.find((result) => result.error)
      if (failed?.error) throw failed.error
    }

    await refreshLogs()
    isEditDialogOpen.value = false
  } catch (e) {
    editError.value = e?.message ?? 'Failed to save meditation logs.'
  } finally {
    editSaving.value = false
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const selectedMonth = useState('meditate-month', () => todayCalendarDate.month)
const selectedYear = useState('meditate-year', () => todayCalendarDate.year)

const availableYears = computed(() => {
  const years = new Set([todayCalendarDate.year])
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

// --- Pivoted table ---

const tableData = computed(() =>
  MEDITATION_PRACTICES.map((practice) => {
    const row = { practice: practice.label, unit: practice.unit }
    for (const day of dayNumbers.value) row[`d${day}`] = countForDay(practice.key, day)
    return row
  }),
)

const columnHelper = createColumnHelper()

const PRACTICE_WIDTH = 150
const UNIT_WIDTH = 80
const DAY_WIDTH = 45

const tableColumns = computed(() => [
  columnHelper.accessor('practice', {
    header: 'Practice',
    size: PRACTICE_WIDTH,
    minSize: PRACTICE_WIDTH,
    maxSize: PRACTICE_WIDTH,
  }),
  columnHelper.accessor('unit', {
    header: 'Unit',
    size: UNIT_WIDTH,
    minSize: UNIT_WIDTH,
    maxSize: UNIT_WIDTH,
  }),
  ...dayNumbers.value.map((day) =>
    columnHelper.accessor(`d${day}`, {
      header: String(day),
      size: DAY_WIDTH,
      minSize: DAY_WIDTH,
      maxSize: DAY_WIDTH,
      cell: (info) => {
        const value = info.getValue()
        return value == null ? h('span', { class: 'opacity-20' }, '—') : value
      },
    }),
  ),
])

const table = useVueTable({
  get data() { return tableData.value },
  get columns() { return tableColumns.value },
  getCoreRowModel: getCoreRowModel(),
  initialState: {
    columnPinning: {
      left: ['practice', 'unit'],
    },
  },
})

// Lazy-load ExcelJS only when user clicks export (~937 kB deferred)
async function handleExport() {
  const { exportToExcel } = await import('~/composables/useMeditationExport')
  await exportToExcel({
    year: selectedYear.value,
    month: selectedMonth.value,
    monthLabel: MONTH_NAMES[selectedMonth.value - 1],
    dayNumbers: dayNumbers.value,
    countForDay,
  })
}

// ---------- Month-Year grouped select ----------

const monthYearGroups = computed(() => {
  return availableYears.value.map((year) => ({
    label: String(year),
    options: MONTH_NAMES.map((month, idx) => `${month} ${year}`).reverse(),
  }))
})

const selectedMonthYear = computed({
  get: () => `${MONTH_NAMES[selectedMonth.value - 1]} ${selectedYear.value}`,
  set: (val) => {
    const [monthName, yearStr] = val.split(' ')
    selectedMonth.value = MONTH_NAMES.indexOf(monthName) + 1
    selectedYear.value = Number(yearStr)
  }
})

// ---------- Dynamic opacity on scroll ----------
const scrollContainer = ref(null)
const columnOpacities = ref({})

function updateOpacities() {
  const container = scrollContainer.value
  if (!container) return

  const scrollLeft = container.scrollLeft
  const pinnedWidth = PRACTICE_WIDTH + UNIT_WIDTH

  const newOpacities = {}

  for (const col of table.getVisibleFlatColumns()) {
    const colId = col.id
    if (col.getIsPinned()) continue

    const headerCell = container.querySelector(`th[data-column-id="${colId}"]`)
    if (!headerCell) continue

    const colLeft = headerCell.offsetLeft - scrollLeft
    const colRight = colLeft + (headerCell.offsetWidth || DAY_WIDTH)

    if (colRight <= pinnedWidth) {
      newOpacities[colId] = 0
    } else if (colLeft < pinnedWidth) {
      const visiblePart = colRight - pinnedWidth
      const totalWidth = headerCell.offsetWidth || DAY_WIDTH
      newOpacities[colId] = Math.max(0, Math.min(1, visiblePart / totalWidth))
    } else {
      newOpacities[colId] = 1
    }
  }

  columnOpacities.value = newOpacities
}

let scrollHandler = null

onMounted(() => {
  if (scrollContainer.value) {
    scrollHandler = () => updateOpacities()
    scrollContainer.value.addEventListener('scroll', scrollHandler, { passive: true })
    updateOpacities()
  }
})

onBeforeUnmount(() => {
  if (scrollContainer.value && scrollHandler) {
    scrollContainer.value.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<template>
  <div class="my-2 grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 py-4 mx-auto font-sans dark:text-gray-100">
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
            <SelectGrouped v-model="selectedMonthYear" :groups="monthYearGroups" />
            <FormWrapper v-model:open="isEditDialogOpen" title="Edit Meditation Log">
              <template #trigger>
                <button
                  type="button"
                  class="p-2 rounded-lg border border-stone-800/20 dark:border-stone-100/20 hover:border-purple-400/50 hover:bg-purple-400/10 transition-colors cursor-pointer"
                  aria-label="Edit meditation log"
                  title="Edit meditation log"
                >
                  <div class="i-solar:pen-2-bold-duotone text-lg" />
                </button>
              </template>

              <template #title-actions>
                <input
                  v-model="selectedEditDate"
                  type="date"
                  class="h-7 px-2 rounded-md border border-stone-800/20 dark:border-stone-100/20 bg-transparent text-xs focus:outline-none focus:border-purple-400/70"
                  aria-label="Select date to edit"
                />
              </template>

              <form class="space-y-3" @submit.prevent="saveEditLogs">
                <div
                  v-for="practice in MEDITATION_PRACTICES"
                  :key="`edit-${practice.key}`"
                  class="grid grid-cols-[1fr_auto] items-center gap-3"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{{ practice.label }}</p>
                    <p class="text-xs opacity-60 truncate">{{ practice.unit }}</p>
                  </div>
                  <input
                    v-model.number="editCounts[practice.key]"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    step="1"
                    class="w-20 text-right focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-2 py-1 border-0 border-b-2"
                  />
                </div>

                <p v-if="editError" class="text-sm text-red-600 dark:text-red-400 bg-red-950/60">
                  {{ editError }}
                </p>

                <button
                  type="submit"
                  :disabled="editSaving"
                  class="flex ml-auto px-3 py-2 mt-6 hover:scale-101 hover:-translate-y-0.5 hover:shadow-lg items-center justify-center border-1 border-stone-700/90 dark:border-stone-100/50 hover:dark:border-stone-100/80 transition-all duration-200 rounded-md px-[15px] leading-none focus:shadow-[0_0_0_2px] focus:outline-none cursor-pointer disabled:opacity-60"
                >
                  {{ editSaving ? 'Saving...' : 'Save changes' }}
                </button>
              </form>
            </FormWrapper>
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
            <div class="h-9 w-48 rounded-xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-stone-700/10 animate-pulse" />
          </template>
        </ClientOnly>
      </div>

      <div ref="scrollContainer" class="overflow-x-auto scrollbar-none mt-4">
        <table class="text-sm table-fixed border-separate" style="border-spacing: 0">
          <thead>
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :data-column-id="header.column.id"
                class="text-left px-2 py-2 font-medium text-xs uppercase tracking-wide opacity-60 whitespace-nowrap overflow-hidden text-ellipsis border-b border-stone-800/10 dark:border-stone-100/10"
                :style="{
                  width: `${header.column.getSize()}px`,
                  minWidth: `${header.column.getSize()}px`,
                  maxWidth: `${header.column.getSize()}px`,
                  position: header.column.getIsPinned() ? 'sticky' : undefined,
                  left: header.column.getIsPinned() ? `${header.column.getStart('left')}px` : undefined,
                  zIndex: header.column.getIsPinned() ? 1 : undefined,
                  opacity: columnOpacities[header.column.id] ?? undefined,
                }"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in table.getRowModel().rows" :key="row.id">
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-2 py-2 whitespace-nowrap overflow-hidden text-ellipsis border-b border-stone-800/10 dark:border-stone-100/10"
                :class="{
                  'text-center': !cell.column.getIsPinned(),
                  'font-medium': cell.column.id === 'practice',
                }"
                :style="{
                  width: `${cell.column.getSize()}px`,
                  minWidth: `${cell.column.getSize()}px`,
                  maxWidth: `${cell.column.getSize()}px`,
                  position: cell.column.getIsPinned() ? 'sticky' : undefined,
                  left: cell.column.getIsPinned() ? `${cell.column.getStart('left')}px` : undefined,
                  zIndex: cell.column.getIsPinned() ? 1 : undefined,
                  opacity: columnOpacities[cell.column.id] ?? undefined,
                }"
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
