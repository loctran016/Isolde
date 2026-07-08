<script setup lang="ts">
import type { TibetanHolyDay } from '~/server/api/tibetan-week.get'

const { data: holyDays } = await useAsyncData('tibetan-week', () =>
  $fetch<TibetanHolyDay[]>('/api/tibetan-week'),
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="card">
    <h2 class="card-title">
      <div class="i-mdi:calendar-star" />
      This week's holy days
    </h2>
    <ul class="mt-4 space-y-3">
      <li
        v-for="day in holyDays"
        :key="day.westernDate"
        class="flex items-center justify-between gap-3"
      >
        <div>
          <p class="text-sm font-medium">{{ day.label }}</p>
          <p class="text-xs text-stone-500">{{ formatDate(day.westernDate) }}</p>
        </div>
        <span
          v-if="day.isAnnual"
          class="text-xs px-2 py-1 rounded-full bg-purple-400/20 text-purple-700 dark:text-purple-300 shrink-0"
        >
          Festival
        </span>
      </li>
      <li v-if="!holyDays?.length" class="text-sm text-stone-500">
        No recognized holy days this week.
      </li>
    </ul>
  </div>
</template>
