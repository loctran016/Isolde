<script setup lang="ts">
import { fromDate, toCalendarDate, type CalendarDate } from '@internationalized/date'
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

interface CalendarEvent {
  id: number
  event: string
  location: string
  date: string
  created_at: string
  type: string
}

const props = defineProps<{
  events: CalendarEvent[]
  defaultDate: CalendarDate
}>()

const selectedDate = ref()

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function dateKey(d: { year: number; month: number; day: number }) {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`
}

const eventsByDate = computed(() => {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of props.events ?? []) {
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
  <TooltipProvider :delay-duration="150">
    <CalendarRoot
      v-slot="{ weekDays, grid }"
      :default-value="defaultDate"
      class="sm:text-lg card"
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
              :key="`week-${month.value.toString()}-${index}`"
              class="grid grid-cols-7 justify-items-center"
            >
              <CalendarCell
                v-for="weekDate in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
                class="relative text-center text-base"
              >
                <template
                  v-for="cellEvents in [eventsForDate(weekDate)]"
                  :key="`cell-${weekDate.toString()}`"
                >
                  <TooltipRoot :disabled="!cellEvents.length">
                    <TooltipTrigger as-child>
                      <CalendarCellTrigger
                        :day="weekDate"
                        :month="month.value"
                        :class="[
                          'relative flex items-center justify-center rounded-full whitespace-nowrap text-sm font-normal w-10 h-10 outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-800 data-[outside-view]:text-stone-900/30 dark:data-[outside-view]:text-stone-50/30 data-[selected]:bg-purple-400/40 data-[selected]:text-purple-700 dark:data-[selected]:bg-purple-500/30 dark:data-[selected]:text-purple-300 data-[selected]:font-bold hover:bg-purple-700/20 dark:hover:bg-purple-400/20 data-[highlighted]:bg-purple-700/20 data-[unavailable]:pointer-events-none data-[unavailable]:text-stone-800/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-white data-[today]:before:block data-[today]:before:bg-purple-400/50 cursor-pointer',
                          'after:absolute after:bottom-[5px] after:rounded-full after:w-1 after:h-1',
                          cellEvents.length
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
                        <div v-for="ev in cellEvents" :key="ev.id">
                          <p class="font-medium leading-snug">{{ ev.event }}</p>
                          <p class="text-xs opacity-75">{{ ev.location }} · {{ ev.type }}</p>
                        </div>
                        <TooltipArrow class="fill-stone-900 dark:fill-stone-100" />
                      </TooltipContent>
                    </TooltipPortal>
                  </TooltipRoot>
                </template>
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </div>
    </CalendarRoot>
  </TooltipProvider>
</template>
