<script setup lang="ts">
import type { CalendarRootProps } from 'reka-ui'
import { fromDate, toCalendarDate, today } from '@internationalized/date'
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

definePageMeta({ title: 'Home Island' })

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

interface TodoItem {
  id: number
  task: string
  done: boolean
  created_at: string
}

const { data: todosData } = await useAsyncData('todo', async () => {
  const { data, error } = await supabase
    .from('todo')
    .select('id, task, done, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as TodoItem[]
})

const todos = ref<TodoItem[]>(todosData.value ? [...todosData.value] : [])

const newTaskText = ref('')
const addingTodo = ref(false)

async function addTodo() {
  const task = newTaskText.value.trim()
  if (!task) return

  addingTodo.value = true
  try {
    const { data, error } = await supabase
      .from('todo')
      .insert({ task, done: false })
      .select('id, task, done, created_at')
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
</script>

<template>
  <div
    class="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-4 gap-x-4 gap-y-4 px-4 py-4 mx-auto font-sans dark:text-gray-100"
  >
    <ClientOnly>
      <TooltipProvider :delay-duration="150">
        <!-- Calendar: 3 rows x 2 cols, top-left -->
        <CalendarRoot
          v-slot="{ weekDays, grid }"
          :is-date-unavailable="isDateUnavailable"
          :default-value="date"
          class="text-lg card lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-3"
          fixed-weeks
          weekdayFormat="short"
          :week-starts-on="1"
          :model-value="selectedDate"
        >
          <CalendarHeader class="flex items-center justify-between">
            <CalendarPrev
              class="inline-flex items-center cursor-pointer justify-center rounded-md bg-transparent p-2 text-2xl hover:-translate-x-1 transition-all duration-200 hover:text-purple-600 active:scale-98 active:transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus:outline-none"
            >
              <div class="i-mdi:arrow-left" />
            </CalendarPrev>
            <CalendarHeading class="font-medium text-xl font-head" />
            <CalendarNext
              class="inline-flex items-center cursor-pointer justify-center rounded-md bg-transparent p-2 text-2xl hover:translate-x-1 transition-all duration-200 hover:text-purple-600 active:scale-98 active:transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus:outline-none"
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
        <TibetanHolyDays class="lg:col-start-1 lg:col-span-2 lg:row-start-4 lg:row-span-1" />

        <!-- Todo: 2 rows x 2 cols, top-right -->
        <div
          class="card text-lg p-8 shadow-sm border flex flex-col gap-4 lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-2"
        >
          <h2 class="card-title">
            <div class="i-mdi:text-box-edit" />
            To-do
          </h2>
          <ul class="flex flex-col gap-2 overflow-y-auto">
            <li v-for="todo in todos" :key="todo.id" class="flex items-center gap-3 group">
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
                class="flex-1"
                @update:model-value="(value) => saveTaskText(todo, String(value))"
              >
                <EditableArea>
                  <EditablePreview
                    :class="[
                      'cursor-text',
                      todo.done ? 'line-through text-stone-500 dark:text-stone-400' : '',
                    ]"
                  />
                  <EditableInput
                    class="w-full bg-transparent outline-none border-b border-purple-400"
                  />
                </EditableArea>
              </EditableRoot>
              <button
                type="button"
                class="opacity-0 group-hover:opacity-100 transition-opacity text-stone-500 hover:text-red-500 shrink-0"
                aria-label="Remove task"
                @click="removeTodo(todo)"
              >
                <div class="i-mdi:close text-lg" />
              </button>
            </li>
            <li v-if="!todos.length" class="text-sm text-stone-500 dark:text-stone-400">
              Nothing to do yet — add your first task below.
            </li>
          </ul>
          <form
            class="flex gap-2 mt-auto pt-2 border-t border-stone-800/10 dark:border-stone-100/10"
            @submit.prevent="addTodo"
          >
            <input
              v-model="newTaskText"
              type="text"
              placeholder="Add a task…"
              class="flex-1 bg-transparent outline-none border-b border-stone-800/30 dark:border-stone-100/30 focus:border-purple-500 transition-colors px-1 py-1"
            />
            <button
              type="submit"
              :disabled="addingTodo || !newTaskText.trim()"
              class="text-sm px-3 py-1.5 rounded-md border border-stone-800/30 dark:border-stone-100/30 hover:border-purple-500 hover:text-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>

        <!-- Pomodoro: 2 rows x 1 col, bottom-right area -->
        <PomodoroTimer class="lg:col-start-3 lg:col-span-1 lg:row-start-3 lg:row-span-2" />

        <!-- Music: 2 rows x 1 col, bottom-right area -->
        <MusicPlayer class="lg:col-start-4 lg:col-span-1 lg:row-start-3 lg:row-span-2" />
      </TooltipProvider>
    </ClientOnly>
  </div>
</template>
