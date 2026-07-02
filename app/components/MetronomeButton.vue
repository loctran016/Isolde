<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuCheckboxItem,
  ContextMenuItemIndicator,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from 'reka-ui'

type SoundMode = 'beep' | 'wood'

const STORAGE_KEY = 'metronome:v2'

// -------- State --------
const isPlaying = ref(false)
const bpm = ref(100)
const beatsPerBar = ref(4)
const accentFirstBeat = ref(true)
const soundMode = ref<SoundMode>('wood')

// visual-only beat indicator
const currentBeat = ref(0)

// -------- Audio scheduling internals --------
let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let schedulerId: ReturnType<typeof setInterval> | null = null

const isAudioUnlocked = ref(false)

let nextNoteTime = 0 // in AudioContext time (seconds)
let beatIndex = 0

const scheduleAheadTime = 0.1 // seconds: how far ahead to schedule audio
const lookahead = 25 // ms: scheduler tick interval

function secondsPerBeat() {
  return 60 / bpm.value
}

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx && !masterGain) {
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 1
    masterGain.connect(audioCtx.destination)
  }
}

async function unlockAudio() {
  ensureAudioContext()
  if (!audioCtx) return false

  try {
    if (audioCtx.state !== 'running') {
      await audioCtx.resume()
    }

    const buffer = audioCtx.createBuffer(1, 1, 22050)
    const src = audioCtx.createBufferSource()
    src.buffer = buffer
    src.connect(masterGain ?? audioCtx.destination)
    src.start(0)

    isAudioUnlocked.value = audioCtx.state === 'running'
    return isAudioUnlocked.value
  } catch {
    isAudioUnlocked.value = false
    return false
  }
}

// -------- Click synthesis --------
function playClick(time: number, accent = false) {
  if (!audioCtx) return

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  const filter = audioCtx.createBiquadFilter()

  if (soundMode.value === 'beep') {
    osc.type = 'square'
    osc.frequency.setValueAtTime(accent ? 1400 : 900, time)

    filter.type = 'highpass'
    filter.frequency.setValueAtTime(500, time)

    // keep beep about same loudness as before
    const peak = accent ? 0.42 : 0.28
    const decay = 0.06
    const attack = 0.001

    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(peak, time + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(masterGain ?? audioCtx.destination)
    osc.start(time)
    osc.stop(time + decay + 0.01)
    return
  }

  // WOOD: louder + fuller
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(accent ? 1000 : 750, time)

  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(accent ? 1500 : 1200, time)
  filter.Q.setValueAtTime(3.5, time)

  // boosted peak and slightly longer decay
  const peak = accent ? 0.75 : 0.55
  const decay = 0.055
  const attack = 0.001

  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + decay)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain ?? audioCtx.destination)
  osc.start(time)
  osc.stop(time + decay + 0.01)
}

function scheduleBeat(time: number) {
  const isAccent = accentFirstBeat.value && beatIndex === 0

  // UI should show 1..beatsPerBar
  const uiBeat = beatIndex + 1

  setTimeout(
    () => {
      if (isPlaying.value) currentBeat.value = uiBeat
    },
    Math.max(0, (time - (audioCtx?.currentTime ?? 0)) * 1000),
  )

  playClick(time, isAccent)

  beatIndex = (beatIndex + 1) % beatsPerBar.value
  nextNoteTime += secondsPerBeat()
}

function scheduler() {
  if (!audioCtx) return
  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    scheduleBeat(nextNoteTime)
  }
}

// -------- Controls --------
async function start() {
  const ok = await unlockAudio()
  if (!ok || !audioCtx) return

  stopSchedulerOnly()

  isPlaying.value = true
  beatIndex = 0
  currentBeat.value = 1
  nextNoteTime = audioCtx.currentTime + 0.03 // tiny latency safety

  scheduler()
  schedulerId = setInterval(scheduler, lookahead)
}

function stop() {
  isPlaying.value = false
  currentBeat.value = 0
  stopSchedulerOnly()
}

function stopSchedulerOnly() {
  if (schedulerId) {
    clearInterval(schedulerId)
    schedulerId = null
  }
}

async function toggle() {
  if (isPlaying.value) stop()
  else await start()
}

function restartIfPlaying() {
  if (isPlaying.value) start()
}

function increaseBpm(step = 1) {
  bpm.value = Math.min(240, bpm.value + step)
}
function decreaseBpm(step = 1) {
  bpm.value = Math.max(30, bpm.value - step)
}
function setBeats(v: number) {
  beatsPerBar.value = v
  beatIndex = 0
  currentBeat.value = 0
}

// -------- Tap tempo --------
const tapTimes = ref<number[]>([])
function tapTempo() {
  const now = performance.now()
  const arr = tapTimes.value

  if (arr.length && now - arr[arr.length - 1] > 2000) arr.length = 0
  arr.push(now)
  if (arr.length > 8) arr.shift()

  if (arr.length >= 2) {
    const intervals: number[] = []
    for (let i = 1; i < arr.length; i++) intervals.push(arr[i] - arr[i - 1])
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const next = Math.round(60000 / avg)
    bpm.value = Math.max(30, Math.min(240, next))
  }
}

// -------- Keyboard: Space toggle --------
function shouldIgnoreSpaceTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    el.isContentEditable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    !!el.closest('[contenteditable="true"]')
  )
}

function onKeydown(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  if (shouldIgnoreSpaceTarget(e.target)) return
  e.preventDefault()
  toggle()
}

// -------- Persistence --------
onMounted(() => {
  // load
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.bpm === 'number') bpm.value = Math.max(30, Math.min(240, parsed.bpm))
      if (typeof parsed.beatsPerBar === 'number')
        beatsPerBar.value = Math.max(2, Math.min(12, parsed.beatsPerBar))
      if (typeof parsed.accentFirstBeat === 'boolean')
        accentFirstBeat.value = parsed.accentFirstBeat
      if (parsed.soundMode === 'beep' || parsed.soundMode === 'wood')
        soundMode.value = parsed.soundMode
    }
  } catch {}

  window.addEventListener('keydown', onKeydown)
})

// save (debounce not necessary here, tiny payload)
watch([bpm, beatsPerBar, accentFirstBeat, soundMode], () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bpm: bpm.value,
        beatsPerBar: beatsPerBar.value,
        accentFirstBeat: accentFirstBeat.value,
        soundMode: soundMode.value,
      }),
    )
  } catch {}
})

// BPM / meter changes should be reflected immediately while playing
watch(bpm, restartIfPlaying)
watch(beatsPerBar, () => {
  beatIndex = 0
  currentBeat.value = 0
  restartIfPlaying()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stop()
  if (audioCtx) {
    const ctx = audioCtx
    audioCtx = null
    masterGain = null
    ctx.close().catch(() => {}) // fire-and-forget, don't await
  }
})
</script>

<template>
  <ContextMenuRoot class="select-none">
    <ContextMenuTrigger as-child>
      <button
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98] transition select-none"
        @click="toggle"
      >
        <span class="inline-flex gap-1">
          <span
            v-for="i in beatsPerBar"
            :key="i"
            class="h-2.5 w-2.5 rounded-full transition"
            :class="isPlaying && currentBeat === i ? 'bg-green-400' : 'bg-neutral-500'"
          />
        </span>

        <span>{{ isPlaying ? 'Metronome On' : 'Metronome Off' }}</span>
        <span class="text-xs text-neutral-300">{{ bpm }} BPM</span>
      </button>
    </ContextMenuTrigger>

    <ContextMenuPortal>
      <ContextMenuContent
        class="min-w-68 max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 pt-2 shadow-xl outline-none dark:border-neutral-700 dark:bg-neutral-900"
      >
        <ContextMenuLabel class="px-2 py-1 text-xs text-neutral-500">
          Metronome (Space to toggle)
        </ContextMenuLabel>

        <ContextMenuItem
          class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @select.prevent="toggle"
        >
          <span>{{ isPlaying ? 'Stop' : 'Start' }}</span>
          <span class="text-xs text-neutral-500">Left click / Space</span>
        </ContextMenuItem>

        <ContextMenuSeparator class="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />

        <ContextMenuItem
          class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @select.prevent="decreaseBpm(1)"
        >
          <span>BPM -1</span><span class="text-neutral-500">{{ bpm }}</span>
        </ContextMenuItem>

        <ContextMenuItem
          class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @select.prevent="increaseBpm(1)"
        >
          <span>BPM +1</span><span class="text-neutral-500">{{ bpm }}</span>
        </ContextMenuItem>

        <ContextMenuItem
          class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          @select.prevent="tapTempo"
        >
          <span>Tap Tempo</span><span class="text-xs text-neutral-500">Click repeatedly</span>
        </ContextMenuItem>

        <ContextMenuSeparator class="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />

        <ContextMenuLabel class="px-2 py-1 text-xs text-neutral-500">
          Beats per bar
        </ContextMenuLabel>

        <ContextMenuRadioGroup
          :model-value="String(beatsPerBar)"
          @update:model-value="(v) => setBeats(Number(v))"
        >
          <ContextMenuRadioItem
            v-for="n in [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
            :key="n"
            :value="String(n)"
            class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <span>{{ n }}/4</span>
            <ContextMenuItemIndicator>✓</ContextMenuItemIndicator>
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>

        <ContextMenuSeparator class="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />

        <ContextMenuCheckboxItem
          v-model="accentFirstBeat"
          class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Accent first beat
          <ContextMenuItemIndicator>✓</ContextMenuItemIndicator>
        </ContextMenuCheckboxItem>

        <ContextMenuSeparator class="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />

        <ContextMenuLabel class="px-2 py-1 text-xs text-neutral-500"> Sound </ContextMenuLabel>
        <ContextMenuRadioGroup v-model="soundMode">
          <ContextMenuRadioItem
            value="beep"
            class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Beep
            <ContextMenuItemIndicator>✓</ContextMenuItemIndicator>
          </ContextMenuRadioItem>
          <ContextMenuRadioItem
            value="wood"
            class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Wood
            <ContextMenuItemIndicator>✓</ContextMenuItemIndicator>
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
