<script setup lang="ts">
import { today, parseDate } from '@internationalized/date'
import {
  CheckboxIndicator,
  CheckboxRoot,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableRoot,
} from 'reka-ui'

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

// Plain const instead of useState — no SSR/hydration mismatch risk for static value
const todayIso = today(TIME_ZONE).toString()
const date = parseDate(todayIso)

const island = getIsland('/')!

useHead({
  title: island.pageTitle,
  meta: [{ name: 'description', content: island.description }],
})

definePageMeta({ title: island.pageTitle, titleIcon: island.titleIcon })

// SUPABASE DATA

const supabase = useSupabaseClient()

interface CalendarEvent {
  id: number
  event: string
  location: string
  date: string
  created_at: string
  type: string
}

const [{ data: events }, { data: todosData }] = await Promise.all([
  useAsyncData('exams', async () => {
    const { data, error } = await supabase.from('exams').select('id, event, location, date, type')
    if (error) throw error
    return data as CalendarEvent[]
  }),
  useAsyncData('todo', async () => {
    const { data, error } = await supabase
      .from('todo')
      .select('id, task, done, type, due_date, created_at')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as TodoItem[]
  }),
])

// --- ENHANCED TODO SYSTEM ---

interface TodoItem {
  id: number
  task: string
  done: boolean
  type: 'task' | 'event'
  due_date: string | null
  created_at: string
}

const todos = ref<TodoItem[]>(todosData.value ? [...todosData.value] : [])

// Filter by type
const taskTodos = computed(() => todos.value.filter((t) => t.type === 'task' || !t.type))
const eventTodos = computed(() => todos.value.filter((t) => t.type === 'event'))

// Sort events by due date (null/overdue first, then upcoming)
function sortByDueDate(items: TodoItem[]) {
  return [...items].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return -1
    if (!b.due_date) return 1
    return a.due_date.localeCompare(b.due_date)
  })
}

const sortedEventTodos = computed(() => sortByDueDate(eventTodos.value))

// Section flex values: Tasks 1.25, Events 1
const sectionFlex = { task: 1.25, event: 1 }

// --- Add new items ---

const newTaskText = ref('')
const addingTodo = ref(false)

const showEventForm = ref(false)
const newEventTask = ref('')
const newEventDueDate = ref('')
const addingEvent = ref(false)

async function addTodo() {
  const task = newTaskText.value.trim()
  if (!task) return

  addingTodo.value = true
  try {
    const { data, error } = await supabase
      .from('todo')
      .insert({ task, done: false, type: 'task' })
      .select('id, task, done, type, due_date, created_at')
      .single()

    if (error) throw error
    todos.value.push(data as TodoItem)
    newTaskText.value = ''
  } catch (e) {
    console.error('Failed to add todo', e)
  } finally {
    addingTodo.value = false
  }
}

async function addEvent() {
  const task = newEventTask.value.trim()
  if (!task) return

  addingEvent.value = true
  try {
    const dueDate = newEventDueDate.value || null
    const { data, error } = await supabase
      .from('todo')
      .insert({ task, done: false, type: 'event', due_date: dueDate })
      .select('id, task, done, type, due_date, created_at')
      .single()

    if (error) throw error
    todos.value.push(data as TodoItem)
    newEventTask.value = ''
    newEventDueDate.value = ''
    showEventForm.value = false
  } catch (e) {
    console.error('Failed to add event', e)
  } finally {
    addingEvent.value = false
  }
}

// --- Toggle / Edit / Delete ---

async function toggleDone(todo: TodoItem, value: boolean) {
  const previous = todo.done
  todo.done = value
  const { error } = await supabase.from('todo').update({ done: value }).eq('id', todo.id)
  if (error) {
    todo.done = previous
    console.error('Failed to update todo', error)
  }
}

async function saveTaskText(todo: TodoItem, value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === todo.task) return

  const previous = todo.task
  todo.task = trimmed
  const { error } = await supabase.from('todo').update({ task: trimmed }).eq('id', todo.id)
  if (error) {
    todo.task = previous
    console.error('Failed to update todo text', error)
  }
}

async function removeTodo(todo: TodoItem) {
  const index = todos.value.findIndex((t) => t.id === todo.id)
  if (index === -1) return

  const [removed] = todos.value.splice(index, 1)
  const { error } = await supabase.from('todo').delete().eq('id', todo.id)
  if (error) {
    todos.value.splice(index, 0, removed)
    console.error('Failed to delete todo', error)
  }
}

// --- Merged format helper (single parseDate call per item) ---

function dueDateMeta(dateStr: string | null): { label: string; overdue: boolean } {
  if (!dateStr) return { label: 'Today', overdue: false }
  const due = parseDate(dateStr)
  const diff = due.compare(date)

  if (diff === 0) return { label: 'Today', overdue: false }
  if (diff === 1) return { label: 'Tomorrow', overdue: false }
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }

  const jsDate = due.toDate(TIME_ZONE)
  return {
    label: jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: false,
  }
}

// Precompute due date metadata for all event todos — avoids calling
// dueDateMeta in every render cycle via v-for template trick
const dueDateMetaMap = computed(() => {
  const map = new Map<number, { label: string; overdue: boolean }>()
  for (const todo of sortedEventTodos.value) {
    map.set(todo.id, dueDateMeta(todo.due_date))
  }
  return map
})
</script>

<template>
  <div
    class="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 lt-sm:my-2 mx-auto font-sans dark:text-gray-100"
  >
    <!-- Advice: luôn nằm trên cùng, full-width -->
    <HomeAdvice />

    <!--
      HÀNG 1 (desktop cao lg:h-[25rem] = 400px):
      Calendar | To-do + Gallery/Music. Chiều cao hàng chỉnh ở đúng 1 chỗ này.
    -->
    <div class="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 gap-3 sm:gap-4 lg:h-[25rem]">
      <!-- Cột trái: Calendar -->
      <div class="min-w-0 lg:h-full">
        <!-- Calendar: lazy-loaded to defer reka-ui Calendar + @internationalized/date ~200 kB -->
        <LazyHomeCalendar
          :events="events ?? []"
          :default-date="date"
          class="sm:text-lg card lg:h-full"
        >
          <template #fallback>
            <div class="card min-h-64 lg:h-full animate-pulse bg-white/20 dark:bg-stone-700/20" />
          </template>
        </LazyHomeCalendar>
      </div>

      <!-- Cột phải: To-do (phần còn lại) / Gallery + Music (h-20) -->
      <div class="flex flex-col gap-3 sm:gap-4 min-w-0 lg:h-full lg:min-h-0">
        <!-- Todo: chiếm phần còn lại của cột, danh sách cuộn bên trong -->
        <div
          class="card text-lg p-6 shadow-sm border flex flex-col gap-3 overflow-hidden lg:flex-1 lg:min-h-0"
        >
          <!-- Header - static -->
          <div class="flex items-center justify-between shrink-0">
            <h2 class="card-title">
              <div class="i-mdi:text-box-edit" />
              To-do
            </h2>
            <span class="text-xs opacity-50">{{ taskTodos.length + eventTodos.length }} items</span>
          </div>

          <!-- TASKS (no due date) -->
          <section class="flex flex-col flex-1 min-h-0">
            <h3
              class="text-xs font-medium opacity-50 uppercase tracking-wider mb-2 flex items-center gap-2 shrink-0"
            >
              <div class="i-mdi:checkbox-outline text-sm" />
              Tasks
            </h3>
            <!-- Mobile: cao cố định h-44. Desktop: giãn theo phần còn lại và cuộn -->
            <PurpleScrollArea class="h-44 lg:h-auto lg:flex-1 lg:min-h-0">
              <ul class="flex flex-col gap-1.5">
                <li v-for="todo in taskTodos" :key="todo.id" class="flex items-center gap-3 group">
                  <CheckboxRoot
                    :model-value="todo.done"
                    class="shrink-0 w-5 h-5 rounded-md border border-stone-800/40 dark:border-stone-100/40 flex items-center justify-center data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 outline-none cursor-pointer transition-colors"
                    @update:model-value="(value) => toggleDone(todo, value === true)"
                  >
                    <CheckboxIndicator>
                      <div class="i-mdi:check text-white text-sm" />
                    </CheckboxIndicator>
                  </CheckboxRoot>
                  <EditableRoot
                    :model-value="todo.task"
                    class="flex-1 min-w-0"
                    @update:model-value="(value) => saveTaskText(todo, String(value))"
                  >
                    <EditableArea>
                      <EditablePreview
                        :class="[
                          'cursor-text text-sm break-words',
                          todo.done ? 'line-through opacity-40' : '',
                        ]"
                      />
                      <EditableInput
                        class="w-full bg-transparent outline-none border-b border-purple-400 text-sm"
                      />
                    </EditableArea>
                  </EditableRoot>
                  <button
                    type="button"
                    class="opacity-0 group-hover:opacity-100 transition-opacity text-stone-500 hover:text-red-500 shrink-0"
                    aria-label="Remove task"
                    @click="removeTodo(todo)"
                  >
                    <div class="i-mdi:close text-base" />
                  </button>
                </li>
                <li v-if="!taskTodos.length" class="text-xs opacity-40 py-1">No tasks yet</li>
              </ul>
            </PurpleScrollArea>
            <!-- Add task form -->
            <form class="flex gap-2 mt-2 shrink-0" @submit.prevent="addTodo">
              <input
                v-model="newTaskText"
                type="text"
                placeholder="Add a task…"
                class="flex-1 bg-transparent outline-none border-b border-stone-800/20 dark:border-stone-100/20 focus:border-purple-500 transition-colors px-1 py-0.5 text-sm"
              />
              <button
                type="submit"
                :disabled="addingTodo || !newTaskText.trim()"
                class="text-xs px-2 py-0.5 rounded-md border border-stone-800/20 dark:border-stone-100/20 hover:border-purple-500 hover:text-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                Add
              </button>
            </form>
          </section>
        </div>

        <!-- Gallery | Sheet Music: h-20 cố định -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
          <NuxtLink
            to="/gallery"
            class="card h-20 relative overflow-hidden group flex items-center gap-3 p-4 hover:scale-[1.01] transition-transform duration-200"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <div class="i-solar:gallery-round-bold text-3xl text-pink-500 shrink-0 relative" />
            <div class="relative min-w-0">
              <p class="font-medium truncate">Gallery</p>
              <p class="text-xs opacity-60 truncate">Every photo, organized by folder and tag.</p>
            </div>
            <div
              class="i-mdi:chevron-right ml-auto text-xl opacity-40 group-hover:opacity-80 transition-opacity relative shrink-0"
            />
          </NuxtLink>

          <NuxtLink
            to="/musical"
            class="card h-20 relative overflow-hidden group flex items-center gap-3 p-4 hover:scale-[1.01] transition-transform duration-200"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <div class="i-mdi:music-clef-treble text-3xl text-purple-500 shrink-0 relative" />
            <div class="relative min-w-0">
              <p class="font-medium truncate">Sheet Music</p>
              <p class="text-xs opacity-60 truncate">
                Sheet music, rendered live, with a built-in metronome.
              </p>
            </div>
            <div
              class="i-mdi:chevron-right ml-auto text-xl opacity-40 group-hover:opacity-80 transition-opacity relative shrink-0"
            />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!--
      HÀNG 2 (desktop cao lg:h-72 = 288px):
      Trái: Pomodoro + Music | Phải: 1 hàng fitness (h-24) + Tibetan Holy Days (phần còn lại).
    -->
    <div class="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 gap-3 sm:gap-4 lg:h-72">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0 lg:h-full">
        <PomodoroTimer class="lg:h-full" />
        <MusicPlayer class="lg:h-full" />
      </div>

      <div class="flex flex-col gap-3 sm:gap-4 min-w-0 lg:h-full lg:min-h-0">
        <!-- 3 nút fitness: h-24 cố định -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 text-gray-800 dark:text-gray-100">
          <StrengthForm>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded="false"
              data-state="closed"
              class="card h-24 flex items-center gap-2 justify-center w-full cursor-pointer group"
            >
              <div
                class="i-solar:dumbbell-large-minimalistic-line-duotone dark:i-solar:dumbbell-large-minimalistic-bold-duotone text-3xl lg:text-5xl"
              />
              <p
                class="text-2xl lg:text-3xl opacity-55 dark:opacity-15 transition-all duration-200 group-hover:opacity-100"
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
              class="card h-24 flex items-center gap-2 justify-center w-full cursor-pointer group"
            >
              <div
                class="i-solar:treadmill-round-line-duotone dark:i-solar:treadmill-round-bold-duotone text-3xl lg:text-5xl"
              />
              <p
                class="text-2xl lg:text-3xl opacity-55 dark:opacity-15 transition-all duration-200 group-hover:opacity-100"
              >
                +
              </p>
            </button>
          </CardioForm>
          <BodyMetricForm>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded="false"
              data-state="closed"
              class="card h-24 flex items-center gap-2 justify-center w-full cursor-pointer group"
            >
              <div
                class="i-solar:weigher-line-duotone dark:i-solar:weigher-bold-duotone text-3xl lg:text-5xl"
              />
              <p
                class="text-2xl lg:text-3xl opacity-55 dark:opacity-15 transition-all duration-200 group-hover:opacity-100"
              >
                +
              </p>
            </button>
          </BodyMetricForm>
        </div>

        <!-- Tibetan Holy Days: chiếm phần còn lại của cột, danh sách cuộn bên trong -->
        <div class="card p-5 flex flex-col gap-3 overflow-hidden lg:flex-1 lg:min-h-0">
          <h2 class="card-title shrink-0">
            <div class="i-mdi:calendar-star" />
            This week's holy days
          </h2>
          <!-- Mobile: cao cố định h-32. Desktop: giãn theo phần còn lại và cuộn -->
          <PurpleScrollArea class="h-32 lg:h-auto lg:flex-1 lg:min-h-0">
            <TibetanHolyDays />
          </PurpleScrollArea>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}
</style>