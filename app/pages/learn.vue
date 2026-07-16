<script setup lang="ts">
import { today, parseDate } from '@internationalized/date'
import { usePreferredDark } from '@vueuse/core'

definePageMeta({ title: 'Med Island', titleIcon: 'i-solar:bookmark-bold' })

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const supabase = useSupabaseClient()

const { themePref } = useTheme()
const colorMode = computed(() => themePref.value)
const prefersDark = usePreferredDark()
const isDark = computed(
  () => colorMode.value === 'dark' || (colorMode.value === 'system' && prefersDark.value),
)

// --- Data fetching ---

interface StudyLog {
  id: number
  subject: string
  topic: string | null
  duration_minutes: number
  confidence: number | null
  notes: string | null
  date: string
}

interface MedicalNote {
  id: number
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
}

const { data: studyLogs, refresh: refreshStudy } = await useAsyncData('study-logs', async () => {
  const { data, error } = await supabase
    .from('study_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(500)

  if (error) throw error
  return (data ?? []) as StudyLog[]
})

const { data: medicalNotes, refresh: refreshNotes } = await useAsyncData(
  'medical-notes',
  async () => {
    const { data, error } = await supabase
      .from('medical_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return (data ?? []) as MedicalNote[]
  },
)

const todayIso = useState('learn-today', () => today(TIME_ZONE).toString())
const todayCalendarDate = computed(() => parseDate(todayIso.value))

// --- Study heatmap data ---

const studyCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const log of studyLogs.value ?? []) {
    if (!log.date) continue
    counts[log.date] = (counts[log.date] ?? 0) + 1
  }
  return counts
})

// --- Stats calculations ---

const studyStreak = computed(() => {
  const dates = Object.keys(studyCounts.value).sort((a, b) => b.localeCompare(a))
  if (dates.length === 0) return 0

  let streak = 0
  let currentDate = todayCalendarDate.value

  // If didn't study today, check from yesterday
  const todayStr = todayIso.value
  if (!dates.includes(todayStr)) {
    currentDate = currentDate.subtract({ days: 1 })
  }

  while (true) {
    const iso = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}-${String(currentDate.day).padStart(2, '0')}`
    if (dates.includes(iso)) {
      streak++
      currentDate = currentDate.subtract({ days: 1 })
    } else {
      break
    }
  }

  return streak
})

const weeklyMinutes = computed(() => {
  const todayDate = todayCalendarDate.value
  const dayOfWeek = todayDate.toDate(TIME_ZONE).getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  let monday = todayDate.subtract({ days: mondayOffset })

  let total = 0
  for (let i = 0; i < 7; i++) {
    const iso = `${monday.year}-${String(monday.month).padStart(2, '0')}-${String(monday.day).padStart(2, '0')}`
    for (const log of studyLogs.value ?? []) {
      if (log.date === iso) total += log.duration_minutes || 0
    }
    monday = monday.add({ days: 1 })
  }
  return total
})

const topicsCount = computed(() => {
  const topics = new Set<string>()
  for (const log of studyLogs.value ?? []) {
    if (log.topic) topics.add(`${log.subject}:${log.topic}`)
  }
  return topics.size
})

const totalSessions = computed(() => (studyLogs.value ?? []).length)

// --- Subject distribution ---

const subjectDistribution = computed(() => {
  const subjects: Record<string, number> = {}
  for (const log of studyLogs.value ?? []) {
    subjects[log.subject] = (subjects[log.subject] ?? 0) + (log.duration_minutes || 0)
  }
  return Object.entries(subjects)
    .map(([name, minutes]) => ({ name, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
})

const SUBJECT_COLORS: Record<string, string> = {
  Anatomy: '#ef4444',
  Physiology: '#f97316',
  Biochemistry: '#eab308',
  Pharmacology: '#22c55e',
  Pathology: '#14b8a6',
  Microbiology: '#3b82f6',
  Immunology: '#8b5cf6',
  Clinical: '#ec4899',
}

const subjectChartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const hours = (params.value / 60).toFixed(1)
        return `${params.name}: ${hours}h (${params.percent}%)`
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 10,
        },
        data: subjectDistribution.value.map((s) => ({
          name: s.name,
          value: s.minutes,
          itemStyle: { color: SUBJECT_COLORS[s.name] || '#6b7280' },
        })),
      },
    ],
  }
})

// --- Today's study log ---

const todayStudyLogs = computed(() => {
  return (studyLogs.value ?? []).filter((log) => log.date === todayIso.value)
})

// --- Quick log form ---

const showLogForm = ref(false)
const quickSubject = ref('')
const quickTopic = ref('')
const quickDuration = ref(30)
const quickConfidence = ref<number | null>(null)
const quickNotes = ref('')
const isSubmitting = ref(false)

const SUBJECTS = [
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Pharmacology',
  'Pathology',
  'Microbiology',
  'Immunology',
  'Clinical',
]

async function submitStudyLog() {
  if (!quickSubject.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const { error } = await supabase.from('study_logs').insert({
      subject: quickSubject.value,
      topic: quickTopic.value || null,
      duration_minutes: quickDuration.value,
      confidence: quickConfidence.value,
      notes: quickNotes.value || null,
      date: todayIso.value,
    })

    if (error) throw error

    // Reset form
    quickTopic.value = ''
    quickConfidence.value = null
    quickNotes.value = ''
    showLogForm.value = false

    await refreshStudy()
  } catch (e) {
    console.error('Failed to log study session', e)
  } finally {
    isSubmitting.value = false
  }
}

// --- Quick notes ---

const showNoteForm = ref(false)
const noteTitle = ref('')
const noteContent = ref('')
const noteCategory = ref('clinical-pearl')
const noteTags = ref('')
const isSavingNote = ref(false)

const NOTE_CATEGORIES = [
  { value: 'clinical-pearl', label: 'Clinical Pearl' },
  { value: 'mnemonic', label: 'Mnemonic' },
  { value: 'diagnostic-criteria', label: 'Diagnostic Criteria' },
  { value: 'drug-class', label: 'Drug Class' },
  { value: 'general', label: 'General' },
]

async function saveMedicalNote() {
  if (!noteTitle.value || !noteContent.value || isSavingNote.value) return

  isSavingNote.value = true
  try {
    const tags = noteTags.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const { error } = await supabase.from('medical_notes').insert({
      title: noteTitle.value,
      content: noteContent.value,
      category: noteCategory.value,
      tags,
    })

    if (error) throw error

    noteTitle.value = ''
    noteContent.value = ''
    noteTags.value = ''
    showNoteForm.value = false

    await refreshNotes()
  } catch (e) {
    console.error('Failed to save note', e)
  } finally {
    isSavingNote.value = false
  }
}

// --- Delete study log ---

async function deleteStudyLog(id: number) {
  const { error } = await supabase.from('study_logs').delete().eq('id', id)
  if (!error) await refreshStudy()
}

// --- Delete medical note ---

async function deleteMedicalNote(id: number) {
  const { error } = await supabase.from('medical_notes').delete().eq('id', id)
  if (!error) await refreshNotes()
}

// --- Format helpers ---

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getConfidenceEmoji(level: number | null) {
  if (!level) return ''
  const emojis = ['', '😰', '🤔', '👍', '💪', '🧠']
  return emojis[level] || ''
}
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-4 mx-auto font-sans dark:text-gray-100"
  >
    <!-- Stats Cards -->
    <div class="col-span-full grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="card !p-4 flex flex-col items-center justify-center gap-1">
        <div class="flex items-center gap-1.5">
          <div class="i-solar:fire-bold text-lg text-amber-500" />
          <span class="text-2xl font-bold text-amber-500">{{ studyStreak }}</span>
        </div>
        <div class="text-xs opacity-60">day streak</div>
      </div>

      <div class="card !p-4 flex flex-col items-center justify-center gap-1">
        <div class="flex items-center gap-1.5">
          <div class="i-solar:clock-circle-bold text-lg text-blue-500" />
          <span class="text-2xl font-bold text-blue-500">{{ formatHours(weeklyMinutes) }}</span>
        </div>
        <div class="text-xs opacity-60">this week</div>
      </div>

      <div class="card !p-4 flex flex-col items-center justify-center gap-1">
        <div class="flex items-center gap-1.5">
          <div class="i-solar:bookmark-bold text-lg text-emerald-500" />
          <span class="text-2xl font-bold text-emerald-500">{{ topicsCount }}</span>
        </div>
        <div class="text-xs opacity-60">topics</div>
      </div>

      <div class="card !p-4 flex flex-col items-center justify-center gap-1">
        <div class="flex items-center gap-1.5">
          <div class="i-solar:documents-bold text-lg text-purple-500" />
          <span class="text-2xl font-bold text-purple-500">{{ totalSessions }}</span>
        </div>
        <div class="text-xs opacity-60">sessions</div>
      </div>
    </div>

    <!-- Study Calendar -->
    <div class="col-span-full card">
      <div class="flex items-center justify-between mb-2">
        <h2 class="card-title">
          <div class="i-solar:calendar-bold" />
          Study Calendar
        </h2>
        <button
          type="button"
          class="px-3 py-1.5 text-sm rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors"
          @click="showLogForm = !showLogForm"
        >
          {{ showLogForm ? 'Cancel' : '+ Log Session' }}
        </button>
      </div>

      <!-- Quick log form -->
      <div v-if="showLogForm" class="mb-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs opacity-60 mb-1 block">Subject *</label>
            <select
              v-model="quickSubject"
              class="w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            >
              <option value="" disabled>Select subject...</option>
              <option v-for="s in SUBJECTS" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs opacity-60 mb-1 block">Duration (min)</label>
            <input
              v-model.number="quickDuration"
              type="number"
              inputmode="numeric"
              min="5"
              step="5"
              class="w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>
          <div>
            <label class="text-xs opacity-60 mb-1 block">Topic</label>
            <input
              v-model="quickTopic"
              type="text"
              placeholder="e.g., Heart valves"
              class="w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>
          <div>
            <label class="text-xs opacity-60 mb-1 block">Confidence (1-5)</label>
            <div class="flex gap-1">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="flex-1 py-2 rounded-lg text-sm border transition-colors"
                :class="
                  quickConfidence === n
                    ? 'bg-amber-500/20 border-amber-400/50'
                    : 'border-stone-200 dark:border-stone-700 hover:border-amber-400/30'
                "
                @click="quickConfidence = n"
              >
                {{ n }}
              </button>
            </div>
          </div>
        </div>
        <div class="mt-3">
          <label class="text-xs opacity-60 mb-1 block">Notes</label>
          <textarea
            v-model="quickNotes"
            rows="2"
            placeholder="Key takeaways..."
            class="w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 resize-none"
          />
        </div>
        <button
          type="button"
          class="mt-3 w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          :disabled="!quickSubject || isSubmitting"
          @click="submitStudyLog"
        >
          {{ isSubmitting ? 'Saving...' : 'Save Session' }}
        </button>
      </div>

      <CalendarHeatmap
        :logs-by-date="studyCounts"
        :max-value="3"
        color="#f59e0b"
        :is-dark="isDark"
        height="h-50"
      />
    </div>

    <!-- Today's Sessions -->
    <div class="card">
      <h2 class="card-title">
        <div class="i-solar:clipboard-list-bold" />
        Today's Study
      </h2>

      <div v-if="todayStudyLogs.length === 0" class="mt-4 text-center text-sm opacity-50 py-8">
        <div class="i-solar:book-bold text-3xl mb-2 mx-auto" />
        <p>No sessions logged today</p>
      </div>

      <ul v-else class="mt-4 space-y-2">
        <li
          v-for="log in todayStudyLogs"
          :key="log.id"
          class="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :style="{ backgroundColor: SUBJECT_COLORS[log.subject] || '#6b7280' }"
              />
              <span class="text-sm font-medium truncate">{{ log.topic || log.subject }}</span>
            </div>
            <div class="flex items-center gap-3 mt-1 text-xs opacity-50">
              <span>{{ log.subject }}</span>
              <span v-if="log.duration_minutes">{{ log.duration_minutes }}m</span>
              <span v-if="log.confidence">{{ getConfidenceEmoji(log.confidence) }}</span>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 ml-2 p-1 rounded hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-colors"
            @click="deleteStudyLog(log.id)"
          >
            <div class="i-mdi:close text-sm" />
          </button>
        </li>
      </ul>
    </div>

    <!-- Subject Distribution -->
    <div class="card">
      <h2 class="card-title">
        <div class="i-solar:pie-chart-bold" />
        Subject Split
      </h2>
      <ClientOnly>
        <VChart
          v-if="subjectDistribution.length > 0"
          :option="subjectChartOption"
          autoresize
          class="h-64 w-full"
        />
        <p v-else class="h-64 flex items-center justify-center text-sm opacity-50">
          Log some study sessions to see your split
        </p>
        <template #fallback>
          <div class="h-64 flex items-center justify-center text-sm opacity-50">Loading…</div>
        </template>
      </ClientOnly>
    </div>

    <!-- Quick Notes / Clinical Pearls -->
    <div class="card">
      <div class="flex items-center justify-between">
        <h2 class="card-title">
          <div class="i-solar:notes-bold" />
          Clinical Pearls
        </h2>
        <button
          type="button"
          class="px-3 py-1.5 text-sm rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors"
          @click="showNoteForm = !showNoteForm"
        >
          {{ showNoteForm ? 'Cancel' : '+ Add' }}
        </button>
      </div>

      <!-- Quick note form -->
      <div
        v-if="showNoteForm"
        class="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-3"
      >
        <input
          v-model="noteTitle"
          type="text"
          placeholder="Title (e.g., Beck's Triad)"
          class="w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
        />
        <textarea
          v-model="noteContent"
          rows="3"
          placeholder="Content..."
          class="w-full rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 resize-none"
        />
        <div class="flex gap-2">
          <select
            v-model="noteCategory"
            class="flex-1 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
          >
            <option v-for="cat in NOTE_CATEGORIES" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
          <input
            v-model="noteTags"
            type="text"
            placeholder="Tags: cardio, emergency"
            class="flex-1 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
          />
        </div>
        <button
          type="button"
          class="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          :disabled="!noteTitle || !noteContent || isSavingNote"
          @click="saveMedicalNote"
        >
          {{ isSavingNote ? 'Saving...' : 'Save Note' }}
        </button>
      </div>

      <!-- Notes list -->
      <div
        v-if="medicalNotes && medicalNotes.length > 0"
        class="mt-4 space-y-2 max-h-96 overflow-y-auto"
      >
        <div
          v-for="note in medicalNotes"
          :key="note.id"
          class="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 group"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-medium">{{ note.title }}</h3>
              <p class="text-xs opacity-70 mt-1 line-clamp-2">{{ note.content }}</p>
              <div class="flex items-center gap-2 mt-2">
                <span
                  class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                >
                  {{ note.category }}
                </span>
                <span
                  v-for="tag in note.tags?.slice(0, 3)"
                  :key="tag"
                  class="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-all"
              @click="deleteMedicalNote(note.id)"
            >
              <div class="i-mdi:close text-sm" />
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="!showNoteForm" class="mt-4 text-center text-sm opacity-50 py-8">
        <div class="i-solar:notebook-bold text-3xl mb-2 mx-auto" />
        <p>No notes yet</p>
      </div>
    </div>
  </div>
</template>
