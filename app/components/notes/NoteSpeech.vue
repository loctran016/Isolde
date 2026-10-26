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

// How many upcoming clips are downloaded while the current one plays, and how many clips are kept
const PREFETCH_AHEAD = 5
const MAX_CACHED = 40

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

// ---- Player chrome: the "..." menu ----
const menuOpen = ref(false)
const root = ref<HTMLElement>()
onClickOutside(root, () => (menuOpen.value = false))
onKeyStroke('Escape', () => (menuOpen.value = false))
watch(state, (s) => {
  if (s === 'idle') menuOpen.value = false
})

// ---- Seek bar (drag to jump between blocks) and A-B loop ----
const scrubbing = ref(false) // true while the thumb is being dragged
const previews = ref<string[]>([]) // first words of every block, shown while dragging
const loopA = ref<number | null>(null) // 1-based block numbers, same as blockNow
const loopB = ref<number | null>(null)
const loopOn = computed(() => loopA.value !== null && loopB.value !== null)
let wasPlaying = false // was it playing when the drag started?
let freshStart = false // the position changed while paused: resuming must start from the new block

const loopLabel = computed(() => {
  if (loopOn.value) return `${loopA.value}–${loopB.value} · Tắt`
  if (loopA.value !== null) return `A ${loopA.value} → chọn B`
  return 'Đặt điểm A'
})
const loopHelp = computed(() => {
  if (loopOn.value) return `Đang lặp đoạn ${loopA.value}–${loopB.value}`
  if (loopA.value !== null)
    return `Điểm A: đoạn ${loopA.value}. Tua đến đoạn cuối cần lặp rồi chọn B trong menu ⋯`
  return ''
})

// What the small bubble above the player says: the block under the thumb while dragging,
// otherwise a warning (for example the silent switch), otherwise the loop help
const status = computed(() =>
  scrubbing.value
    ? `${blockNow.value}/${blockTotal.value} · ${previews.value[blockNow.value - 1] ?? ''}`
    : hint.value || loopHelp.value,
)

// Fill of the bar up to the thumb, and the position of the loop segment under it.
// The thumb is 12px wide, so the usable track is 100% - 12px.
const pct = computed(() =>
  blockTotal.value > 1 ? ((blockNow.value - 1) / (blockTotal.value - 1)) * 100 : 0,
)
const frac = (n: number) => (blockTotal.value > 1 ? (n - 1) / (blockTotal.value - 1) : 0)
const loopStyle = computed(() => {
  if (loopA.value === null) return null
  const a = frac(loopA.value)
  const b = loopB.value !== null ? frac(loopB.value) : a
  return {
    left: `calc(6px + (100% - 12px) * ${a})`,
    width: `max(4px, calc((100% - 12px) * ${b - a}))`,
  }
})

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

// ---- Clip cache: the next few clips are downloaded while the current one plays ----
const ready = new Map<string, string>() // clip id -> blob: URL (insertion order: oldest first)
const pending = new Set<string>() // downloads in flight
const missing = new Set<string>() // clips the server answered 404 for
let cacheGen = 0 // bumped when the cache is thrown away, so late downloads are ignored

function fetchClip(id: string) {
  if (ready.has(id) || pending.has(id) || missing.has(id)) return
  const gen = cacheGen
  pending.add(id)
  $fetch<Blob>(`${AUDIO_BASE}/${id}.mp3`, { responseType: 'blob' })
    .then((blob) => {
      if (gen !== cacheGen) return // the note changed meanwhile
      const typed = blob.type ? blob : blob.slice(0, blob.size, 'audio/mpeg')
      ready.set(id, URL.createObjectURL(typed))
    })
    .catch((e: any) => {
      if (gen !== cacheGen) return
      // 404: the clip does not exist (yet). Other errors (offline...) are not remembered, so it is retried later
      if ((e?.statusCode ?? e?.status ?? e?.response?.status) === 404) missing.add(id)
    })
    .finally(() => {
      if (gen === cacheGen) pending.delete(id)
    })
}

// Drop the oldest clips when there are too many, never the ones in `keep`
function trimClips(keep: Set<string>) {
  for (const [id, url] of ready) {
    if (ready.size <= MAX_CACHED) break
    if (keep.has(id)) continue
    URL.revokeObjectURL(url)
    ready.delete(id)
  }
}

function clearClips() {
  cacheGen++
  for (const url of ready.values()) URL.revokeObjectURL(url)
  ready.clear()
  pending.clear()
  missing.clear()
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

// smooth = false while dragging the bar: the page follows the thumb instantly
function highlight(el: HTMLElement | null, smooth = true) {
  if (el === lit) return
  lit?.classList.remove('tts-active')
  lit = el
  if (el) {
    el.classList.add('tts-active')
    el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
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

const firstIndexOfBlock = (n: number) => queue.findIndex((c) => c.block === n - 1)

// The piece that follows piece j. With an A-B loop on, the piece after block B is the first piece of A.
// Used only when playback moves on by itself, so a manual jump can leave the loop.
function nextIndex(j: number) {
  const next = j + 1
  if (loopOn.value) {
    const cur = queue[j]
    const nx = queue[next]
    if (cur && cur.block + 1 === loopB.value && (!nx || nx.block + 1 > loopB.value!))
      return Math.max(firstIndexOfBlock(loopA.value!), 0)
  }
  return next
}

// Start downloading the next clips, following the loop if there is one
function prefetchFrom(i: number) {
  const keep = new Set<string>([queue[i].id])
  let j = i
  for (let k = 0; k < PREFETCH_AHEAD; k++) {
    j = nextIndex(j)
    const c = queue[j]
    if (!c) break
    keep.add(c.id)
    fetchClip(c.id)
  }
  trimClips(keep)
}

function speakAt(i: number, chained = false) {
  const mine = ++session
  freshStart = false

  if (i >= queue.length) return stop()
  if (!chained) killSound()

  const chunk = queue[i]
  state.value = 'playing'
  blockNow.value = chunk.block + 1
  highlight(chunk.el)

  if (engine.value === 'neural') playNeural(i, mine)
  else speakBrowser(i, chained, mine)
}

// This one clip is missing: read only this block with the built-in voice, then go back to the AI voice
function readWithBrowserVoice(i: number, mine: number) {
  console.warn('[tts] missing clip', queue[i].id, JSON.stringify(queue[i].text))
  if (hasSpeech.value) speakBrowser(i, true, mine)
  else speakAt(nextIndex(i), true)
}

function playNeural(i: number, mine: number) {
  const a = getAudio()
  const id = queue[i].id

  prefetchFrom(i) // download the next clips while this one plays

  // already known to be missing: no need to wait for a network error
  if (missing.has(id)) return readWithBrowserVoice(i, mine)

  a.onended = () => {
    if (mine === session) speakAt(nextIndex(i), true)
  }
  a.onerror = () => {
    if (mine === session) readWithBrowserVoice(i, mine)
  }
  a.onplaying = () => {
    if (mine === session) hint.value = ''
  }

  const rate = settings.value.rate
  a.defaultPlaybackRate = rate // set before src: loading a new src resets playbackRate to this
  // A downloaded clip (a blob: URL) starts at once. Otherwise stream it straight from the server,
  // right here, because iOS only lets audio start inside the tap.
  a.src = ready.get(id) ?? `${AUDIO_BASE}/${id}.mp3`
  a.playbackRate = rate
  a.play().catch((e) => {
    if (mine !== session || e?.name === 'AbortError') return
    hint.value = 'Chạm ▶ để phát (trình duyệt chặn tự phát).'
    state.value = 'paused'
  })
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
    if (mine === session) speakAt(nextIndex(i), true)
  }
  u.onerror = (e) => {
    if (mine !== session || e.error === 'canceled' || e.error === 'interrupted') return
    speakAt(nextIndex(i), true)
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
  // first words of every block, for the preview bubble while dragging
  const firsts: string[] = []
  for (const c of queue) if (firsts[c.block] === undefined) firsts[c.block] = c.text
  previews.value = firsts
  loopA.value = loopB.value = null
  engine.value = useNeural.value ? 'neural' : 'browser'
  if (engine.value === 'neural') setupMediaSession()
  // begin at the first block that is on screen (the very top when the note isn't scrolled)
  const first = queue.findIndex((c) => c.el.getBoundingClientRect().bottom > 120)
  speakAt(Math.max(first, 0))
}

const index = () => Math.max(firstIndexOfBlock(blockNow.value), 0)

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
  // after a seek the loaded clip is the old one, so start again from the block the bar points to
  if (!freshStart && engine.value === 'neural' && audio?.src) {
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
  scrubbing.value = false
  loopA.value = loopB.value = null
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

// ---- Dragging the seek bar ----
// The first movement pauses the sound; every step moves the highlight (and the page) to that block;
// letting go starts reading from there again if it was playing before.
function onScrub(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (!scrubbing.value) {
    scrubbing.value = true
    wasPlaying = state.value === 'playing'
    session++ // a late "ended" event from the clip we are leaving must not start the next one
    killSound()
    clearTimeout(watchdog)
    hint.value = ''
    state.value = 'paused'
  }
  const chunk = queue.find((c) => c.block === v - 1)
  if (chunk) {
    blockNow.value = v
    highlight(chunk.el, false)
  }
}

function onScrubEnd() {
  if (!scrubbing.value) return
  scrubbing.value = false
  freshStart = true
  if (wasPlaying) speakAt(index())
}

// ---- A-B loop: 1st tap marks A, 2nd tap marks B, 3rd tap clears ----
function cycleLoop() {
  if (loopOn.value) {
    loopA.value = loopB.value = null
    return
  }
  if (loopA.value === null) {
    loopA.value = blockNow.value
    return
  }
  let a = loopA.value
  let b = blockNow.value
  if (b < a) [a, b] = [b, a]
  loopA.value = a
  loopB.value = b // the same block twice loops that single block
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
    clearClips() // the next note has different clips
    neuralReady.value = false
    setTimeout(probe, 600)
  },
)

onBeforeUnmount(() => {
  stop()
  clearClips()
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

    <!-- Player: bottom left, so it never covers the search button -->
    <Teleport to="body">
      <div
        v-if="state !== 'idle'"
        ref="root"
        class="fixed left-4 z-40 w-[min(26rem,calc(100vw-6rem))]"
        style="bottom: calc(1rem + env(safe-area-inset-bottom, 0px))"
      >
        <!-- Bubble: the block under the thumb while dragging, or a warning / loop help -->
        <div
          v-if="status && !menuOpen"
          class="absolute bottom-full left-0 mb-2 max-w-full rounded-lg bg-neutral-900/95 px-3 py-1.5 text-xs shadow-lg"
          :class="scrubbing ? 'truncate text-white' : hint ? 'text-amber-300' : 'text-white/80'"
          role="status"
        >
          {{ status }}
        </div>

        <!-- Menu: voice, A-B loop, previous / next block -->
        <div
          v-if="menuOpen"
          class="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-white/10 bg-neutral-900/95 p-2 text-sm text-white shadow-xl backdrop-blur"
        >
          <div class="px-2 pb-1 pt-1 text-xs uppercase tracking-wide text-white/50">Giọng đọc</div>
          <div class="flex gap-1 px-1">
            <button
              type="button"
              class="flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              :class="engine === 'neural' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'"
              :disabled="!neuralReady"
              @click="engine !== 'neural' && switchEngine()"
            >
              AI
            </button>
            <button
              type="button"
              class="flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-center transition-colors"
              :class="engine === 'browser' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'"
              @click="engine !== 'browser' && switchEngine()"
            >
              Máy
            </button>
          </div>
          <p v-if="!neuralReady" class="px-2 pt-1 text-xs text-white/50">
            Giọng AI chưa có cho ghi chú này.
          </p>
          <select
            v-if="engine === 'browser' && viVoices.length > 1"
            class="mt-2 w-full rounded-lg bg-white/10 px-2 py-1.5 text-sm outline-none"
            :value="voice?.name"
            aria-label="Giọng đọc"
            @change="pickVoice"
          >
            <option v-for="v in viVoices" :key="v.name" :value="v.name" class="bg-neutral-800">
              {{ v.name }}
            </option>
          </select>
          <p
            v-if="engine === 'browser' && voices.length && !viVoices.length"
            class="px-2 pt-1 text-xs text-amber-300"
          >
            Chưa có giọng tiếng Việt
          </p>

          <div class="my-2 border-t border-white/10" />
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-white/10"
            :aria-label="
              loopOn
                ? 'Tắt vòng lặp A–B'
                : loopA !== null
                  ? 'Chọn điểm B của vòng lặp'
                  : 'Chọn điểm A của vòng lặp'
            "
            @click="cycleLoop"
          >
            <span>Vòng lặp A–B</span>
            <span
              class="text-xs tabular-nums"
              :class="loopA !== null ? 'text-purple-300' : 'text-white/50'"
            >
              {{ loopLabel }}
            </span>
          </button>

          <div class="my-2 border-t border-white/10" />
          <div class="flex gap-1 px-1">
            <button
              type="button"
              class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs hover:bg-white/20"
              @click="jump(-1)"
            >
              <span class="i-solar:skip-previous-bold" /> Đoạn trước
            </button>
            <button
              type="button"
              class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs hover:bg-white/20"
              @click="jump(1)"
            >
              Đoạn sau <span class="i-solar:skip-next-bold" />
            </button>
          </div>

          <p v-if="debug" class="px-2 pt-2 text-xs text-white/50">
            engine: {{ engine }} · AI sẵn sàng: {{ neuralReady }} · giọng: {{ voices.length }} ·
            vi: {{ viVoices.length }}
          </p>
        </div>

        <!-- The bar -->
        <div
          class="relative flex items-center gap-1 rounded-full border border-white/10 bg-neutral-900/95 py-1 pl-1 pr-1.5 text-white shadow-lg backdrop-blur"
        >
          <button
            type="button"
            class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-lg hover:bg-white/15"
            :aria-label="state === 'playing' ? 'Tạm dừng' : 'Tiếp tục'"
            @click="toggle"
          >
            <span :class="state === 'playing' ? 'i-solar:pause-bold' : 'i-solar:play-bold'" />
          </button>

          <span class="min-w-[3.25rem] shrink-0 text-center text-xs tabular-nums text-white/90">
            {{ blockNow }}/{{ blockTotal }}
          </span>

          <!-- Seek bar: drag to jump between blocks (it snaps to each block) -->
          <div class="relative min-w-0 flex-1">
            <input
              v-if="blockTotal > 1"
              type="range"
              class="tts-range"
              min="1"
              :max="blockTotal"
              step="1"
              :value="blockNow"
              :style="{ '--p': pct + '%' }"
              aria-label="Tua đến đoạn"
              :aria-valuetext="`Đoạn ${blockNow} trên ${blockTotal}`"
              @input="onScrub"
              @change="onScrubEnd"
              @pointerup="onScrubEnd"
              @pointercancel="onScrubEnd"
            />
            <!-- A-B loop, drawn as a purple segment under the bar -->
            <div
              v-if="loopStyle"
              class="pointer-events-none absolute top-[calc(50%+8px)] h-[3px] rounded-full bg-purple-400"
              :style="loopStyle"
            />
          </div>

          <button
            type="button"
            class="shrink-0 cursor-pointer rounded-full px-2 py-1.5 text-xs tabular-nums hover:bg-white/15"
            aria-label="Tốc độ đọc"
            @click="cycleRate"
          >
            {{ settings.rate }}×
          </button>

          <button
            type="button"
            class="relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-lg hover:bg-white/15"
            :class="menuOpen ? 'bg-white/15' : ''"
            aria-label="Tuỳ chọn"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <span class="i-solar:menu-dots-bold" />
            <!-- a dot while an A-B loop is set, so it is not forgotten behind the menu -->
            <span
              v-if="loopA !== null"
              class="absolute right-1 top-1 size-2 rounded-full bg-purple-400"
            />
          </button>

          <!-- Stop: a small badge on the corner, like in the reference -->
          <button
            type="button"
            class="absolute -right-1.5 -top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-neutral-700 text-xs text-white hover:bg-neutral-600"
            aria-label="Dừng"
            @click="stop"
          >
            <span class="i-solar:close-circle-bold" />
          </button>
        </div>
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

/* Seek bar: a thin white track that fills up to the thumb, like the reference */
.tts-range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  width: 100%;
  height: 1.75rem; /* a tall touch target around a thin track */
  margin: 0;
  cursor: pointer;
  --p: 0%;
}
.tts-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 9999px;
  background: linear-gradient(to right, #fff var(--p), rgba(255, 255, 255, 0.3) var(--p));
}
.tts-range::-moz-range-track {
  height: 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.3);
}
.tts-range::-moz-range-progress {
  height: 4px;
  border-radius: 9999px;
  background: #fff;
}
.tts-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  margin-top: -4px; /* centres the 12px thumb on the 4px track */
  border: 0;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.tts-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 0;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
</style>
