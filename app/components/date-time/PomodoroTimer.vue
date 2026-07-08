<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const STORAGE_KEY = 'pomodoro:v1'

const workMinutes = ref(25)
const breakMinutes = ref(5)
const longBreakMinutes = ref(15)
const cyclesBeforeLongBreak = ref(4)

type Phase = 'work' | 'break' | 'longBreak'
const phase = ref<Phase>('work')
const completedCycles = ref(0)
const secondsLeft = ref(workMinutes.value * 60)
const isRunning = ref(false)

let intervalId: ReturnType<typeof setInterval> | null = null
let audioCtx: AudioContext | null = null

function phaseDurationSeconds(p: Phase) {
  if (p === 'work') return workMinutes.value * 60
  if (p === 'break') return breakMinutes.value * 60
  return longBreakMinutes.value * 60
}

function playChime() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, audioCtx.currentTime)
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.65)
}

function advancePhase() {
  playChime()
  if (phase.value === 'work') {
    completedCycles.value++
    phase.value = completedCycles.value % cyclesBeforeLongBreak.value === 0 ? 'longBreak' : 'break'
  } else {
    phase.value = 'work'
  }
  secondsLeft.value = phaseDurationSeconds(phase.value)
}

function tick() {
  if (secondsLeft.value <= 1) {
    advancePhase()
    return
  }
  secondsLeft.value--
}

function start() {
  if (isRunning.value) return
  isRunning.value = true
  intervalId = setInterval(tick, 1000)
}

function pause() {
  isRunning.value = false
  if (intervalId) clearInterval(intervalId)
  intervalId = null
}

function toggle() {
  isRunning.value ? pause() : start()
}

function reset() {
  pause()
  phase.value = 'work'
  completedCycles.value = 0
  secondsLeft.value = phaseDurationSeconds('work')
}

const formattedTime = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (secondsLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const phaseLabel = computed(() => {
  if (phase.value === 'work') return 'Focus'
  if (phase.value === 'break') return 'Short break'
  return 'Long break'
})

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.workMinutes === 'number') workMinutes.value = parsed.workMinutes
      if (typeof parsed.breakMinutes === 'number') breakMinutes.value = parsed.breakMinutes
      if (typeof parsed.longBreakMinutes === 'number')
        longBreakMinutes.value = parsed.longBreakMinutes
      if (typeof parsed.cyclesBeforeLongBreak === 'number')
        cyclesBeforeLongBreak.value = parsed.cyclesBeforeLongBreak
    }
    secondsLeft.value = phaseDurationSeconds(phase.value)
  } catch {}
})

watch([workMinutes, breakMinutes, longBreakMinutes, cyclesBeforeLongBreak], () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        workMinutes: workMinutes.value,
        breakMinutes: breakMinutes.value,
        longBreakMinutes: longBreakMinutes.value,
        cyclesBeforeLongBreak: cyclesBeforeLongBreak.value,
      }),
    )
  } catch {}
})

onBeforeUnmount(() => {
  pause()
  audioCtx?.close().catch(() => {})
})
</script>

<template>
  <div class="card flex flex-col items-center gap-4">
    <h2 class="card-title">
      <div class="i-mdi:clock-star-four-points" />
      Pomodoro
    </h2>

    <p class="text-sm light:text-stone-500">{{ phaseLabel }} · Cycle {{ completedCycles + 1 }}</p>
    <p class="text-5xl font-semibold tabular-nums">{{ formattedTime }}</p>

    <div class="flex gap-2">
      <button
        type="button"
        class="rounded-full px-5 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 cursor-pointer"
        @click="toggle"
      >
        {{ isRunning ? 'Pause' : 'Start' }}
      </button>
      <button
        type="button"
        class="rounded-full px-5 py-2 border border-stone-800/20 dark:border-stone-100/20 hover:border-stone-800/40 dark:hover:border-stone-100/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 cursor-pointer"
        @click="reset"
      >
        Reset
      </button>
    </div>
  </div>
</template>
