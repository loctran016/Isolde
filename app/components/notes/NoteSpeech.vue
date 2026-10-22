<script setup lang="ts">
// Plays the note aloud. Uses the pre-generated VieNeu audio once it has been published,
// and the browser's built-in voice for anything that has no audio yet.
import { collectChunks } from '~~/scripts/tts-text.mjs'

const props = withDefaults(defineProps<{ target?: string; lang?: string; title?: string }>(), {
  target: '.markdown-body',
  lang: 'vi-VN',
  title: '',
})

// GitHub Pages of this repo: the workflow publishes audio/<id>.mp3 there
const AUDIO_BASE = 'https://loctran016.github.io/Isolde/audio'

type Chunk = { el: HTMLElement; text: string; block: number; id: string }

const route = useRoute()
const hasSpeech = ref(false)
const state = ref<'idle' | 'playing' | 'paused'>('idle')
const blockNow = ref(0)
const blockTotal = ref(0)
const hint = ref('')
const settings = useLocalStorage('note-tts', { rate: 1, voice: '', engine: 'auto' })
const voices = ref<SpeechSynthesisVoice[]>([])
// Add ?ttsDebug to the URL to see which voice engine is in use
const debug = computed(() => 'ttsDebug' in route.query)

// "neural" = the pre-generated VieNeu audio, "browser" = the built-in speech
const neuralReady = ref(false) // is the audio for this note published?
const engine = ref<'neural' | 'browser'>('browser') // engine of the current playback
const useNeural = computed(() => neuralReady.value && settings.value.engine !== 'browser')
const canPlay = computed(() => hasSpeech.value || neuralReady.value)

function collect(): Chunk[] {
  const root = document.querySelector(props.target)
  return root ? (collectChunks(root) as Chunk[]) : []
}

// ---- Built-in voices (the fallback) ----
// iOS often returns an empty list the first time, and "voiceschanged" does not always fire,
// so the list is loaded again on a timer, on that event, and when you tap Nghe.
let pollTimer: ReturnType<typeof setTimeout> | undefined
let onVoicesChanged: (() => void) | null = null

function loadVoices() {
  if (!hasSpeech.value) return 0
  const list = window.speechSynthesis.getVoices()
  if (list.length) voices.value = list // never replace a good list with a transient empty one
  return list.length
}

function pollVoices(tries = 20) {
  if (loadVoices() || tries <= 0) return
  pollTimer = setTimeout(() => pollVoices(tries - 1), 250)
}

const isVi = (v: SpeechSynthesisVoice) =>
  v.lang.replace('_', '-').toLowerCase().startsWith('vi') ||
  /\b(linh|hoaimy|nam ?minh)\b/i.test(v.name)

const viVoices = computed(() => voices.value.filter(isVi))
const voice = computed(
  () => viVoices.value.find((v) => v.name === settings.value.voice) ?? viVoices.value[0] ?? null,
)

// ---- Is this note's audio published yet? Checked ahead of time, never inside a tap ----
async function probe(tries = 3) {
  const first = collect()[0]
  if (!first) {
    if (tries > 0) setTimeout(() => probe(tries - 1), 600)
    return
  }
  try {
    const res = await fetch(`${AUDIO_BASE}/${first.id}.mp3`, { method: 'HEAD' })
    neuralReady.value = res.ok
  } catch {
    neuralReady.value = false
  }
}

let queue: Chunk[] = []
let session = 0 // every (re)start bumps this, so a late "end" event from an old clip is ignored
let current: SpeechSynthesisUtterance | null = null // keep a reference: Chrome can garbage-collect it mid-speech
let audio: HTMLAudioElement | null = null // ONE element for the whole note: iOS only allows replays on an element a tap has started
let lit: HTMLElement | null = null
let isIOS = false
let started = false
let watchdog: ReturnType<typeof setTimeout> | undefined

function getAudio() {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
    ;(audio as any).preservesPitch = true
  }
  return audio
}

function highlight(el: HTMLElement | null) {
  if (el === lit) return
  lit?.classList.remove('tts-active')
  lit = el
  if (el) {
    el.classList.add('tts-active')
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

// Silences whatever is playing, from either engine
function killSound() {
  if (audio) {
    audio.onended = audio.onerror = audio.onplaying = null
    audio.pause()
  }
  if (hasSpeech.value) window.speechSynthesis.cancel()
}

function speakAt(i: number, chained = false) {
  const mine = ++session
  if (i >= queue.length) return stop()
  if (!chained) killSound()

  const chunk = queue[i]
  state.value = 'playing'
  blockNow.value = chunk.block + 1
  highlight(chunk.el)

  if (engine.value === 'neural') playNeural(i, mine)
  else speakBrowser(i, chained, mine)
}

function playNeural(i: number, mine: number) {
  const a = getAudio()
  a.onended = () => {
    if (mine === session) speakAt(i + 1, true)
  }
  a.onerror = () => {
    if (mine !== session) return
    // this clip is not published (yet): do the rest with the built-in voice
    hint.value = 'Chưa có giọng AI cho đoạn này, chuyển sang giọng máy.'
    engine.value = 'browser'
    neuralReady.value = false
    speakAt(i, true)
  }
  a.onplaying = () => {
    if (mine === session) hint.value = ''
  }

  const rate = settings.value.rate
  a.defaultPlaybackRate = rate // set before src: loading a new src resets playbackRate to this
  a.src = `${AUDIO_BASE}/${queue[i].id}.mp3`
  a.playbackRate = rate
  a.play().catch((e) => {
    if (mine !== session || e?.name === 'AbortError') return
    hint.value = 'Chạm ▶ để phát (trình duyệt chặn tự phát).'
    state.value = 'paused'
  })

  // warm the cache with the next clip so the gap between blocks stays short
  const next = queue[i + 1]
  if (next) {
    const w = new Audio()
    w.preload = 'auto'
    w.src = `${AUDIO_BASE}/${next.id}.mp3`
  }
}

function speakBrowser(i: number, chained: boolean, mine: number) {
  const synth = window.speechSynthesis
  const u = new SpeechSynthesisUtterance(queue[i].text)
  u.lang = voice.value?.lang ?? props.lang // even with no voice object, lang makes iOS pick its Vietnamese voice
  if (voice.value) u.voice = voice.value
  u.rate = settings.value.rate
  u.onstart = () => {
    if (mine !== session) return
    started = true
    hint.value = ''
  }
  u.onend = () => {
    if (mine === session) speakAt(i + 1, true)
  }
  u.onerror = (e) => {
    if (mine !== session || e.error === 'canceled' || e.error === 'interrupted') return
    speakAt(i + 1, true)
  }
  current = u

  const speakNow = () => {
    if (mine === session) synth.speak(u)
  }
  const busy = synth.speaking || synth.pending
  if (!chained && busy) synth.cancel()

  // iOS only plays audio for speak() calls made synchronously inside the tap, so never delay it there.
  // Other engines can drop a speak() that comes right after cancel(), so give them a short gap.
  if (!chained && busy && !isIOS) setTimeout(speakNow, 60)
  else speakNow()

  // Nothing started within a few seconds of a tap: tell the user instead of failing silently
  if (!chained) {
    started = false
    clearTimeout(watchdog)
    watchdog = setTimeout(() => {
      if (mine === session && !started)
        hint.value =
          'Không có tiếng? Tắt chế độ im lặng (công tắc chuông bên hông máy) rồi chạm ▶ lần nữa.'
    }, 2500)
  }
}

// Lock screen / headphone controls (neural audio keeps playing with the screen off)
function setupMediaSession() {
  if (!('mediaSession' in navigator)) return
  const ms = navigator.mediaSession
  ms.metadata = new MediaMetadata({ title: props.title || document.title, artist: 'Notes Island' })
  ms.setActionHandler('play', () => state.value === 'paused' && toggle())
  ms.setActionHandler('pause', () => state.value === 'playing' && toggle())
  ms.setActionHandler('previoustrack', () => jump(-1))
  ms.setActionHandler('nexttrack', () => jump(1))
}

function start() {
  loadVoices() // refresh the list right inside the tap
  queue = collect()
  if (!queue.length) return
  hint.value = ''
  blockTotal.value = queue.at(-1)!.block + 1
  engine.value = useNeural.value ? 'neural' : 'browser'
  if (engine.value === 'neural') setupMediaSession()
  // begin at the first block that is on screen (the very top when the note isn't scrolled)
  const first = queue.findIndex((c) => c.el.getBoundingClientRect().bottom > 120)
  speakAt(Math.max(first, 0))
}

const index = () =>
  Math.max(
    queue.findIndex((c) => c.block === blockNow.value - 1),
    0,
  )

function pause() {
  if (engine.value === 'neural') {
    audio?.pause() // a real pause: resuming continues from the same second
  } else {
    session++
    if (hasSpeech.value) window.speechSynthesis.cancel() // resuming re-reads the current piece (pause() itself is unreliable on phones)
  }
  state.value = 'paused'
}

function resume() {
  if (engine.value === 'neural' && audio?.src) {
    state.value = 'playing'
    hint.value = ''
    audio.play().catch(() => {
      state.value = 'paused'
      hint.value = 'Chạm ▶ để phát tiếp.'
    })
  } else speakAt(index())
}

function stop() {
  session++
  clearTimeout(watchdog)
  hint.value = ''
  killSound()
  if (audio) {
    audio.removeAttribute('src')
    audio.load()
  }
  state.value = 'idle'
  highlight(null)
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = null
}

function toggle() {
  if (state.value === 'idle') start()
  else if (state.value === 'playing') pause()
  else resume()
}

// Jump to the previous / next block
function jump(delta: number) {
  if (!queue.length) return
  const target = Math.min(Math.max(blockNow.value - 1 + delta, 0), blockTotal.value - 1)
  speakAt(queue.findIndex((c) => c.block === target))
}

// Speed applies at once to neural audio; the built-in voice restarts the current piece
const RATES = [0.9, 1, 1.15, 1.3, 1.5]
function cycleRate() {
  const i = RATES.indexOf(settings.value.rate)
  const rate = RATES[(i + 1) % RATES.length]
  settings.value.rate = rate
  if (engine.value === 'neural') {
    if (audio) {
      audio.defaultPlaybackRate = rate
      audio.playbackRate = rate
    }
  } else if (state.value === 'playing') speakAt(index())
}

function pickVoice(e: Event) {
  settings.value.voice = (e.target as HTMLSelectElement).value
  if (state.value === 'playing') speakAt(index())
}

// AI voice <-> built-in voice
function switchEngine() {
  const to = engine.value === 'neural' ? 'browser' : 'neural'
  settings.value.engine = to === 'browser' ? 'browser' : 'auto'
  engine.value = to
  if (to === 'neural') setupMediaSession()
  if (state.value !== 'idle') speakAt(index())
}

onMounted(() => {
  hasSpeech.value = 'speechSynthesis' in window
  isIOS =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (hasSpeech.value) {
    onVoicesChanged = () => loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    pollVoices()
  }
  setTimeout(probe, 400)
})

watch(
  () => route.path,
  () => {
    stop()
    neuralReady.value = false
    setTimeout(probe, 600)
  },
)

onBeforeUnmount(() => {
  stop()
  clearTimeout(pollTimer)
  if (hasSpeech.value && onVoicesChanged)
    window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
})
</script>

<template>
  <ClientOnly>
    <!-- Trigger (sits next to the share / graph buttons) -->
    <button
      v-if="canPlay"
      type="button"
      class="flex cursor-pointer items-center gap-1.5 rounded-full border border-purple-300/30 px-3 py-1.5 text-xs transition-colors hover:bg-purple-500/20 lg:text-sm"
      :class="state !== 'idle' ? 'bg-purple-500/20' : ''"
      aria-label="Nghe đọc ghi chú"
      @click="toggle"
    >
      <span
        :class="
          state === 'playing' ? 'i-solar:pause-bold' : 'i-solar:headphones-round-sound-linear'
        "
        class="text-base"
      />
      <span class="hidden sm:inline">
        {{ state === 'idle' ? 'Nghe' : state === 'playing' ? 'Tạm dừng' : 'Tiếp tục' }}
      </span>
    </button>

    <!-- Floating player (bottom left, so it never covers the search button) -->
    <Teleport to="body">
      <div
        v-if="state !== 'idle'"
        class="fixed left-4 z-40 flex max-w-[calc(100vw-6rem)] flex-wrap items-center gap-1 rounded-full border border-purple-300/40 bg-stone-50/95 px-2 py-1.5 text-stone-900 shadow-lg backdrop-blur dark:bg-stone-900/95 dark:text-gray-100"
        style="bottom: calc(1rem + env(safe-area-inset-bottom, 0px))"
      >
        <button
          class="cursor-pointer rounded-full p-2 hover:bg-purple-500/20"
          aria-label="Đoạn trước"
          @click="jump(-1)"
        >
          <span class="i-solar:skip-previous-bold block" />
        </button>
        <button
          class="cursor-pointer rounded-full bg-purple-600 p-2 text-white"
          :aria-label="state === 'playing' ? 'Tạm dừng' : 'Tiếp tục'"
          @click="toggle"
        >
          <span
            :class="state === 'playing' ? 'i-solar:pause-bold' : 'i-solar:play-bold'"
            class="block"
          />
        </button>
        <button
          class="cursor-pointer rounded-full p-2 hover:bg-purple-500/20"
          aria-label="Đoạn sau"
          @click="jump(1)"
        >
          <span class="i-solar:skip-next-bold block" />
        </button>
        <button
          class="cursor-pointer rounded-full p-2 hover:bg-purple-500/20"
          aria-label="Dừng"
          @click="stop"
        >
          <span class="i-solar:stop-bold block" />
        </button>
        <span class="px-1 text-xs tabular-nums opacity-70">{{ blockNow }}/{{ blockTotal }}</span>
        <button
          class="cursor-pointer rounded-full px-2 py-1 text-xs tabular-nums hover:bg-purple-500/20"
          aria-label="Tốc độ đọc"
          @click="cycleRate"
        >
          {{ settings.rate }}×
        </button>
        <button
          v-if="neuralReady"
          class="cursor-pointer rounded-full px-2 py-1 text-xs font-semibold hover:bg-purple-500/20"
          :aria-label="
            engine === 'neural'
              ? 'Đang dùng giọng AI, chạm để đổi sang giọng máy'
              : 'Đang dùng giọng máy, chạm để đổi sang giọng AI'
          "
          @click="switchEngine"
        >
          {{ engine === 'neural' ? 'AI' : 'Máy' }}
        </button>
        <select
          v-if="engine === 'browser' && viVoices.length > 1"
          class="max-w-28 rounded bg-transparent text-xs outline-none"
          :value="voice?.name"
          aria-label="Giọng đọc"
          @change="pickVoice"
        >
          <option v-for="v in viVoices" :key="v.name" :value="v.name">{{ v.name }}</option>
        </select>
        <!-- Only warn once the browser has returned voices and none of them is Vietnamese -->
        <span
          v-if="engine === 'browser' && voices.length && !viVoices.length"
          class="px-1 text-xs text-amber-500"
        >
          Chưa có giọng tiếng Việt
        </span>
        <span v-if="hint" class="basis-full px-2 text-xs text-amber-500">{{ hint }}</span>
        <span v-if="debug" class="basis-full px-2 text-xs opacity-70">
          engine: {{ engine }} · AI sẵn sàng: {{ neuralReady }} · giọng: {{ voices.length }} · vi:
          {{ viVoices.length }}
        </span>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style>
.tts-active {
  background: rgba(192, 132, 252, 0.18);
  box-shadow: 0 0 0 4px rgba(192, 132, 252, 0.18);
  border-radius: 0.25rem;
  transition: background 0.2s;
}
</style>
