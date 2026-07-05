<script setup lang="ts">
import type { CalendarRootProps } from 'reka-ui'
// import { Icon } from '@iconify/vue'
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
  title: 'IndexForty',
  meta: [
    {
      name: 'description',
      content:
        'The ultimate modular dashboard. IndexForty indexes your tasks, renders your music notation, logs your fitness metrics, and hosts your media gallery from a single, lightweight application.',
    },
  ],
})

const selectedDate = ref()

// --- Events from Supabase, matched to calendar cells ---

interface CalendarEvent {
  id: number
  event: string
  location: string
  date: string // timestamptz
  created_at: string
  type: string
}

const supabase = useSupabaseClient()

const { data: events } = await useAsyncData('exams', async () => {
  const { data, error } = await supabase
    .from('exams') // <-- swap for your real table name if different
    .select('id, event, location, date, type')

  if (error) throw error
  return data as CalendarEvent[]
})

function dateKey(d: { year: number; month: number; day: number }) {
  return `${d.year}-${d.month}-${d.day}`
}

const eventsByDate = computed(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events.value ?? []) {
    // Convert the timestamptz into a plain calendar date in the same
    // timezone the calendar itself uses, so "23:00 UTC" doesn't land
    // on the wrong day.
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
</script>

<template>
  <div class="min-h-screen">
    <div
      class="grid lg:grid-cols-6 gap-4 h-screen items-center max-w-9/10 lg:max-w-4/5 px-4 py-4 mx-auto font-sans dark:text-gray-100"
    >
      <ClientOnly>
        <TooltipProvider :delay-duration="150">
          <CalendarRoot
            v-slot="{ weekDays, grid }"
            :is-date-unavailable="isDateUnavailable"
            :default-value="date"
            class="rounded-xl lg:order-first text-lg lg:col-span-3 bg-white/50 dark:bg-stone-500/50 border-stone-800/30 p-8 shadow-sm border dark:border-stone-300/30"
            fixed-weeks
            weekdayFormat="short"
            :week-starts-on="1"
            :model-value="selectedDate"
          >
            <CalendarHeader class="flex items-center justify-between">
              <CalendarPrev
                class="inline-flex items-center cursor-pointer justify-center rounded-md bg-transparent p-2 text-2xl hover:-translate-x-1 transition-all duration-200 hover:text-purple-600 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <div class="i-mdi:arrow-left" />
              </CalendarPrev>
              <CalendarHeading class="font-medium text-xl font-head" />

              <CalendarNext
                class="inline-flex items-center cursor-pointer justify-center rounded-md bg-transparent p-2 text-2xl hover:translate-x-1 transition-all duration-200 hover:text-purple-600 active:scale-98 active:transition-all focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                <CalendarGridBody class="grid">
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
                              'relative flex items-center justify-center rounded-full whitespace-nowrap text-sm font-normal w-10 h-10 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[outside-view]:text-stone-900/30 dark:data-[outside-view]:text-stone-50/30 data-[selected]:bg-purple-400/40 data-[selected]:text-purple-700 dark:data-[selected]:bg-purple-500/30 dark:data-[selected]:text-purple-300 data-[selected]:font-bold hover:bg-purple-700/20 dark:hover:bg-purple-400/20 data-[highlighted]:bg-purple-700/20 data-[unavailable]:pointer-events-none data-[unavailable]:text-stone-800/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-purple-400/50 cursor-pointer',
                              'after:absolute after:bottom-[5px] after:rounded-full after:w-1 after:h-1 after:bg-emerald-400',
                              eventsForDate(weekDate).length
                                ? 'after:block ring-1 ring-pink-600/70 dark:ring-pink-400/70 font-semibold'
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
        </TooltipProvider>
      </ClientOnly>
    </div>
  </div>
</template>
