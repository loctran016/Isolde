<script setup lang="ts">
import type { CalendarRootProps } from 'reka-ui'
import { fromDate, toCalendarDate, today, parseDate } from '@internationalized/date'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  CheckboxIndicator,
  CheckboxRoot,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableRoot,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const date = today(TIME_ZONE)
const todayIso = computed(() => date.toString())

const isDateUnavailable: CalendarRootProps['isDateUnavailable'] = (date) => {
  return date.day === 317
}

useHead({
  title: 'Isolde',
  meta: [
    {
      name: 'description',
      content:
        'Your personal isolate islands — tasks, sound, movement, and memory, each in its own calm, focused space.',
    },
  ],
})

definePageMeta({ title: 'Home Island', titleIcon: 'i-mdi:home' })

const selectedDate = ref()

interface CalendarEvent {
  id: number
  event: string
  location: string
  date: string
  created_at: string
  type: string
}

// SUPABASE DATA

const supabase = useSupabaseClient()

const { data: events } = await useAsyncData('exams', async () => {
  const { data, error } = await supabase.from('exams').select('id, event, location, date, type')

  if (error) throw error
  return data as CalendarEvent[]
})

function dateKey(d: { year: number; month: number; day: number }) {
  return `${d.year}-${d.month}-${d.day}`
}

const eventsByDate = computed(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events.value ?? []) {
    const zoned = fromDate(new Date(ev.date), TIME_ZONE)
    const key = dateKey(toCalendarDate(zoned))
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return map
})

function eventsForDate(d: { year: number; month: number; day: number }) {
  return eventsByDate.value.get(dateKey(d)) ?? []
}

// --- ENHANCED TODO SYSTEM ---

interface TodoItem {
  id: number
  task: string
  done: boolean
  type: 'task' | 'study' | 'event'
  due_date: string | null
  created_at: string
}

const { data: todosData } = await useAsyncData('todo', async () => {
  const { data, error } = await supabase
    .from('todo')
    .select('id, task, done, type, due_date, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as TodoItem[]
})

const todos = ref<TodoItem[]>(todosData.value ? [...todosData.value] : [])

// Filter by type
const taskTodos = computed(() => todos.value.filter(t => t.type === 'task' || !t.type))
const studyTodos = computed(() => todos.value.filter(t => t.type === 'study'))
const eventTodos = computed(() => todos.value.filter(t => t.type === 'event'))

// Sort study and events by due date (null/overdue first, then upcoming)
function sortByDueDate(items: TodoItem[]) {
  return [...items].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return -1
    if (!b.due_date) return 1
    return a.due_date.localeCompare(b.due_date)
  })
}

const sortedStudyTodos = computed(() => sortByDueDate(studyTodos.value))
const sortedEventTodos = computed(() => sortByDueDate(eventTodos.value))

// Section flex values: Tasks 1, Study 2, Events 1
const sectionFlex = { task: 1, study: 2, event: 1 }

// --- Add new items ---

const newTaskText = ref('')
const addingTodo = ref(false)

const showStudyForm = ref(false)
const newStudyTask = ref('')
const newStudyDueDate = ref('')
const addingStudy = ref(false)

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

async function addStudy() {
  const task = newStudyTask.value.trim()
  if (!task) return

  addingStudy.value = true
  try {
    const dueDate = newStudyDueDate.value || null
    const { data, error } = await supabase
      .from('todo')
      .insert({ task, done: false, type: 'study', due_date: dueDate })
      .select('id, task, done, type, due_date, created_at')
      .single()

    if (error) throw error
    todos.value.push(data as TodoItem)
    newStudyTask.value = ''
    newStudyDueDate.value = ''
    showStudyForm.value = false
  } catch (e) {
    console.error('Failed to add study', e)
  } finally {
    addingStudy.value = false
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

// --- Format helpers ---

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'Today'
  const due = parseDate(dateStr)
  const todayDate = date
  const diff = due.compare(todayDate)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d overdue`

  const jsDate = due.toDate(TIME_ZONE)
  return jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const due = parseDate(dateStr)
  return due.compare(date) < 0
}
</script>

<template>
  <div
    class="grid grid-cols-1 lt-sm:my-2 lg:grid-cols-4 lg:grid-rows-4 gap-3 p-3 sm:gap-4 sm:p-4 mx-auto font-sans dark:text-gray-100"
  >
    <ClientOnly>
      <TooltipProvider :delay-duration="150">
        <!-- Calendar: 3 rows x 2 cols, top-left -->
        <CalendarRoot
          v-slot="{ weekDays, grid }"
          :is-date-unavailable="isDateUnavailable"
          :default-value="date"
          class="sm:text-lg card lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-3"
          fixed-weeks
          weekdayFormat="short"
          :week-starts-on="1"
          :model-value="selectedDate"
        >
          <CalendarHeader class="flex items-center justify-between text-sm">
            <CalendarPrev
              class="inline-flex items-center cursor-pointer justify-center rounded-md bg-transparent p-2 text-xl sm:text-2xl hover:-translate-x-1 transition-all duration-200 hover:text-purple-600 active:scale-98 active:transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus:outline-none"
            >
              <div class="i-mdi:arrow-left" />
            </CalendarPrev>
            <CalendarHeading class="font-medium text-lg sm:text-xl font-head" />
            <CalendarNext
              class="inline-flex items-center cursor-pointer justify-center rounded-md bg-transparent p-2 text-xl sm:text-2xl hover:translate-x-1 transition-all duration-200 hover:text-purple-600 active:scale-98 active:transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus:outline-none"
            >
              <div class="i-mdi:arrow-right" />
            </CalendarNext>
          </CalendarHeader>
          <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <CalendarGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="w-full border-collapse select-none space-y-1"
            >
              <CalendarGridHead>
                <CalendarGridRow class="mb-1 grid w-full grid-cols-7">
                  <CalendarHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="rounded-md text-base text-center text-stone-900 dark:text-stone-100"
                  >
                    {{ day }}
                  </CalendarHeadCell>
                </CalendarGridRow>
              </CalendarGridHead>
              <CalendarGridBody class="grid gap-1">
                <CalendarGridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="`weekDate-${index}`"
                  class="grid grid-cols-7 justify-items-center"
                >
                  <CalendarCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                    class="relative text-center text-base"
                  >
                    <TooltipRoot :disabled="!eventsForDate(weekDate).length">
                      <TooltipTrigger as-child>
                        <CalendarCellTrigger
                          :day="weekDate"
                          :month="month.value"
                          :class="[
                            'relative flex items-center justify-center rounded-full whitespace-nowrap text-sm font-normal w-10 h-10 outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800 data-[outside-view]:text-stone-900/30 dark:data-[outside-view]:text-stone-50/30 data-[selected]:bg-purple-400/40 data-[selected]:text-purple-700 dark:data-[selected]:bg-purple-500/30 dark:data-[selected]:text-purple-300 data-[selected]:font-bold hover:bg-purple-700/20 dark:hover:bg-purple-400/20 data-[highlighted]:bg-purple-700/20 data-[unavailable]:pointer-events-none data-[unavailable]:text-stone-800/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-purple-400/50 cursor-pointer',
                            'after:absolute after:bottom-[5px] after:rounded-full after:w-1 after:h-1',
                            eventsForDate(weekDate).length
                              ? 'after:block after:bg-pink-500 ring-1 ring-pink-500/70 font-semibold !text-pink-600 dark:!text-pink-400 !bg-pink-400/40 hover:!bg-pink-400/60 dark:!bg-pink-500/30 dark:hover:!bg-pink-500/50 data-[selected]:!bg-pink-400/50 dark:data-[selected]:!bg-pink-500/40 data-[outside-view]:!bg-transparent data-[outside-view]:hover:!bg-transparent dark:data-[outside-view]:!bg-transparent dark:data-[outside-view]:hover:!bg-transparent data-[outside-view]:!ring-0 data-[outside-view]:after:!hidden data-[outside-view]:!text-stone-900/30 dark:data-[outside-view]:!text-stone-50/30 data-[outside-view]:!font-normal'
                              : 'after:hidden',
                          ]"
                        />
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent
                          :side-offset="6"
                          class="z-20 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 px-3 py-2 text-sm shadow-lg max-w-64 space-y-1.5"
                        >
                          <div v-for="ev in eventsForDate(weekDate)" :key="ev.id">
                            <p class="font-medium leading-snug">{{ ev.event }}</p>
                            <p class="text-xs opacity-75">{{ ev.location }} · {{ ev.type }}</p>
                          </div>
                          <TooltipArrow class="fill-stone-900 dark:fill-stone-100" />
                        </TooltipContent>
                      </TooltipPortal>
                    </TooltipRoot>
                  </CalendarCell>
                </CalendarGridRow>
              </CalendarGridBody>
            </CalendarGrid>
          </div>
        </CalendarRoot>

        <!-- Holy days: 1 row x 2 cols, below calendar -->
        <div class="card lg:col-start-1 lg:col-span-2 lg:row-start-4 lg:row-span-1">
          <h2 class="card-title">
            <div class="i-mdi:calendar-star" />
            This week's holy days
          </h2>
          <TibetanHolyDays class="" />
        </div>

        <!-- Todo: Expanded to 2 cols x 4 rows, replacing Pomodoro & Music -->
        <div
          class="card text-lg p-6 shadow-sm border flex flex-col gap-4 lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-4 overflow-hidden"
        >
          <!-- Header - static -->
          <div class="flex items-center justify-between shrink-0">
            <h2 class="card-title">
              <div class="i-mdi:text-box-edit" />
              To-do
            </h2>
            <span class="text-xs opacity-50">{{ taskTodos.length + studyTodos.length + eventTodos.length }} items</span>
          </div>

          <!-- Sections with proportional heights -->
          <div class="flex flex-col gap-5 flex-1 min-h-0">
            
            <!-- TASKS (no due date) -->
            <section class="flex flex-col min-h-0" :style="{ flex: sectionFlex.task }">
              <h3 class="text-xs font-medium opacity-50 uppercase tracking-wider mb-2 flex items-center gap-2 shrink-0">
                <div class="i-mdi:checkbox-outline text-sm" />
                Tasks
              </h3>
              <ul class="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col gap-1.5">
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
              <!-- Add task form – always visible -->
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

            <!-- STUDY (purple, with due dates) -->
            <section class="flex flex-col min-h-0" :style="{ flex: sectionFlex.study }">
              <h3 class="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2 shrink-0">
                <div class="i-mdi:book-open-outline text-sm" />
                Study
              </h3>
              <ul class="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col gap-1.5">
                <li v-for="todo in sortedStudyTodos" :key="todo.id" class="flex items-center gap-3 group">
                  <CheckboxRoot
                    :model-value="todo.done"
                    class="shrink-0 w-5 h-5 rounded-md border border-purple-400/50 flex items-center justify-center data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 outline-none cursor-pointer transition-colors"
                    @update:model-value="(value) => toggleDone(todo, value === true)"
                  >
                    <CheckboxIndicator>
                      <div class="i-mdi:check text-white text-sm" />
                    </CheckboxIndicator>
                  </CheckboxRoot>
                  <div class="flex-1 min-w-0">
                    <EditableRoot
                      :model-value="todo.task"
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
                  </div>
                  <span
                    class="text-[11px] shrink-0"
                    :class="isOverdue(todo.due_date) ? 'text-red-500 font-medium' : 'text-purple-500/70'"
                  >
                    {{ formatDueDate(todo.due_date) }}
                  </span>
                </li>
                <li v-if="!studyTodos.length" class="text-xs opacity-40 py-1">No study items yet</li>
              </ul>
              <!-- Add study form -->
              <div v-if="showStudyForm" class="mt-2 space-y-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 shrink-0">
                <input
                  v-model="newStudyTask"
                  type="text"
                  placeholder="Lecture / topic…"
                  class="w-full bg-transparent outline-none border-b border-purple-400/30 focus:border-purple-500 px-1 py-0.5 text-sm"
                />
                <div class="flex gap-2 items-center">
                  <input
                    v-model="newStudyDueDate"
                    type="date"
                    class="flex-1 bg-transparent outline-none border-b border-purple-400/30 focus:border-purple-500 px-1 py-0.5 text-sm"
                  />
                  <button
                    type="button"
                    class="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50 shrink-0"
                    :disabled="addingStudy || !newStudyTask.trim()"
                    @click="addStudy"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    class="text-xs px-2 py-0.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shrink-0"
                    @click="showStudyForm = false"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <button
                v-else
                type="button"
                class="mt-2 text-xs text-purple-500/60 hover:text-purple-500 transition-colors cursor-pointer shrink-0"
                @click="showStudyForm = true"
              >
                + Add study item
              </button>
            </section>

            <!-- EVENTS (pink, with due dates) -->
            <section class="flex flex-col min-h-0" :style="{ flex: sectionFlex.event }">
              <h3 class="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-2 flex items-center gap-2 shrink-0">
                <div class="i-mdi:calendar-star text-sm" />
                Important Events
              </h3>
              <ul class="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col gap-1.5">
                <li v-for="todo in sortedEventTodos" :key="todo.id" class="flex items-center gap-3 group">
                  <CheckboxRoot
                    :model-value="todo.done"
                    class="shrink-0 w-5 h-5 rounded-md border border-pink-400/50 flex items-center justify-center data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 outline-none cursor-pointer transition-colors"
                    @update:model-value="(value) => toggleDone(todo, value === true)"
                  >
                    <CheckboxIndicator>
                      <div class="i-mdi:check text-white text-sm" />
                    </CheckboxIndicator>
                  </CheckboxRoot>
                  <div class="flex-1 min-w-0">
                    <EditableRoot
                      :model-value="todo.task"
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
                          class="w-full bg-transparent outline-none border-b border-pink-400 text-sm"
                        />
                      </EditableArea>
                    </EditableRoot>
                  </div>
                  <span
                    class="text-[11px] shrink-0"
                    :class="isOverdue(todo.due_date) ? 'text-red-500 font-medium' : 'text-pink-500/70'"
                  >
                    {{ formatDueDate(todo.due_date) }}
                  </span>
                </li>
                <li v-if="!eventTodos.length" class="text-xs opacity-40 py-1">No events yet</li>
              </ul>
              <!-- Add event form -->
              <div v-if="showEventForm" class="mt-2 space-y-2 p-3 rounded-lg bg-pink-500/5 border border-pink-500/20 shrink-0">
                <input
                  v-model="newEventTask"
                  type="text"
                  placeholder="Event name…"
                  class="w-full bg-transparent outline-none border-b border-pink-400/30 focus:border-pink-500 px-1 py-0.5 text-sm"
                />
                <div class="flex gap-2 items-center">
                  <input
                    v-model="newEventDueDate"
                    type="date"
                    class="flex-1 bg-transparent outline-none border-b border-pink-400/30 focus:border-pink-500 px-1 py-0.5 text-sm"
                  />
                  <button
                    type="button"
                    class="text-xs px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-600 dark:text-pink-400 hover:bg-pink-500/30 transition-colors disabled:opacity-50 shrink-0"
                    :disabled="addingEvent || !newEventTask.trim()"
                    @click="addEvent"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    class="text-xs px-2 py-0.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shrink-0"
                    @click="showEventForm = false"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <button
                v-else
                type="button"
                class="mt-2 text-xs text-pink-500/60 hover:text-pink-500 transition-colors cursor-pointer shrink-0"
                @click="showEventForm = true"
              >
                + Add event
              </button>
            </section>
          </div>
        </div>
      </TooltipProvider>
    </ClientOnly>
  </div>
</template>
