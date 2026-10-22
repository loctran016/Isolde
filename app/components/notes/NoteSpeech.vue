<script setup lang="ts">
// Reads the rendered note aloud with the browser's built-in speech (no package, no API key).
const props = withDefaults(defineProps<{ target?: string; lang?: string }>(), {
  target: '.markdown-body',
  lang: 'vi-VN',
})

type Chunk = { el: HTMLElement; text: string; block: number }

const route = useRoute()
const supported = ref(false)
const state = ref<'idle' | 'playing' | 'paused'>('idle')
const blockNow = ref(0)
const blockTotal = ref(0)
const hint = ref('')
const settings = useLocalStorage('note-tts', { rate: 1, voice: '' })
const voices = ref<SpeechSynthesisVoice[]>([])

// How abbreviations and symbols should be spoken. Extend these lists as you like.
// (HC is left out on purpose: it can mean "hội chứng" or "hồng cầu".)
const ABBREVIATIONS: Record<string, string> = {
  BN: 'bệnh nhân',
  ĐM: 'động mạch',
  TM: 'tĩnh mạch',
  HA: 'huyết áp',
  KS: 'kháng sinh',
  LS: 'lâm sàng',
  CLS: 'cận lâm sàng',
  TB: 'tế bào',
  BC: 'bạch cầu',
  ĐTĐ: 'đái tháo đường',
  XQ: 'X quang',
}
const REPLACEMENTS: [RegExp, string][] = [
  [/≥/g, ' lớn hơn hoặc bằng '],
  [/≤/g, ' nhỏ hơn hoặc bằng '],
  [/≠/g, ' khác '],
  [/≈/g, ' xấp xỉ '],
  [/±/g, ' cộng trừ '],
  [/[→⟶]/g, ' dẫn đến '],
  [/[⇒⟹]/g, ' suy ra '],
  [/[↔⇔⟺⟷]/g, ' tương đương '],
  [/↑/g, ' tăng '],
  [/↓/g, ' giảm '],
  [/°C/g, ' độ C'],
  [/°/g, ' độ '],
  [/(\d)\s*%/g, '$1 phần trăm'],
  [/~\s*(?=\d)/g, 'khoảng '],
  [/(?<=\s)>(?=\s*\d)/g, ' lớn hơn '],
  [/(?<=\s)<(?=\s*\d)/g, ' nhỏ hơn '],
  [/[—–]/g, ', '],
  [/&/g, ' và '],
]

function speakable(raw: string) {
  let s = raw.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (c) => c.normalize('NFKD')) // O₂ -> O2
  for (const [re, to] of REPLACEMENTS) s = s.replace(re, to)
  for (const [abbr, spoken] of Object.entries(ABBREVIATIONS))
    s = s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${abbr}(?![\\p{L}\\p{N}])`, 'gu'), spoken)
  return s.replace(/[*_`#|\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

// Engines drop or cut off long utterances, so split long blocks into sentence-sized pieces
function split(text: string, max = 200): string[] {
  if (text.length <= max) return [text]
  const out: string[] = []
  let cur = ''
  for (const sentence of text.split(/(?<=[.!?…;:])\s+/)) {
    if (cur && `${cur} ${sentence}`.length > max) {
      out.push(cur)
      cur = sentence
    } else cur = cur ? `${cur} ${sentence}` : sentence
  }
  if (cur) out.push(cur)
  return out.flatMap((c) =>
    c.length <= max * 1.5 ? [c] : (c.match(new RegExp(`.{1,${max}}(?:\\s|$)`, 'g')) ?? [c]),
  )
}

// What gets read: headings, paragraphs, list items, summaries. Skipped: code, tables, diagrams,
// and anything marked data-no-tts.
const SKIP = 'table, pre, svg, .mermaid, .table-wrap, [data-no-tts]'

function collect(): Chunk[] {
  const root = document.querySelector(props.target)
  if (!root) return []
  const out: Chunk[] = []
  let block = 0
  root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6,p,li,summary').forEach((el) => {
    if (el.closest(SKIP)) return
    // read only this element's own text: nested lists and paragraphs are separate blocks
    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('ul, ol, p, table, pre, svg, .mermaid, [data-no-tts]').forEach((n) => n.remove())
    const text = speakable(clone.textContent ?? '')
    if (!text) return
    for (const part of split(text)) out.push({ el, text: part, block })
    block++
  })
  return out
}

// ---- Voices ----
const viVoices = computed(() =>
  voices.value.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('vi')),
)
const voice = computed(
  () => viVoices.value.find((v) => v.name === settings.value.voice) ?? viVoices.value[0] ?? null,
)

let queue: Chunk[] = []
let session = 0 // every (re)start bumps this, so a late "end" event from an old utterance is ignored
let current: SpeechSynthesisUtterance | null = null // keep a reference: Chrome can garbage-collect it mid-speech
let lit: HTMLElement | null = null
let isIOS = false
let started = false
let watchdog: ReturnType<typeof setTimeout> | undefined

function highlight(el: HTMLElement | null) {
  if (el === lit) return
  lit?.classList.remove('tts-active')
  lit = el
  if (el) {
    el.classList.add('tts-active')
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

function speakAt(i: number, chained = false) {
  const synth = window.speechSynthesis
  const mine = ++session
  if (i >= queue.length) return stop()

  const chunk = queue[i]
  state.value = 'playing'
  blockNow.value = chunk.block + 1
  highlight(chunk.el)

  const u = new SpeechSynthesisUtterance(chunk.text)
  u.lang = voice.value?.lang ?? props.lang
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
        hint.value = 'Không có tiếng? Tắt chế độ im lặng (công tắc chuông bên hông máy) rồi chạm ▶ lần nữa.'
    }, 2500)
  }
}

function start() {
  queue = collect()
  if (!queue.length) return
  hint.value = ''
  blockTotal.value = queue.at(-1)!.block + 1
  // begin at the first block that is on screen (the very top when the note isn't scrolled)
  const first = queue.findIndex((c) => c.el.getBoundingClientRect().bottom > 120)
  speakAt(Math.max(first, 0))
}

const index = () => Math.max(queue.findIndex((c) => c.block === blockNow.value - 1), 0)

function pause() {
  session++
  window.speechSynthesis.cancel()
  state.value = 'paused' // resuming re-reads the current piece (pause() itself is unreliable on phones)
}

function stop() {
  session++
  clearTimeout(watchdog)
  hint.value = ''
  if (supported.value) window.speechSynthesis.cancel()
  state.value = 'idle'
  highlight(null)
}

function toggle() {
  if (state.value === 'idle') start()
  else if (state.value === 'playing') pause()
  else speakAt(index())
}

// Jump to the previous / next block
function jump(delta: number) {
  if (!queue.length) return
  const target = Math.min(Math.max(blockNow.value - 1 + delta, 0), blockTotal.value - 1)
  speakAt(queue.findIndex((c) => c.block === target))
}

// Changing speed or voice restarts the current piece so it applies immediately
const RATES = [0.9, 1, 1.15, 1.3, 1.5]
function cycleRate() {
  const i = RATES.indexOf(settings.value.rate)
  settings.value.rate = RATES[(i + 1) % RATES.length]
  if (state.value === 'playing') speakAt(index())
}
function pickVoice(e: Event) {
  settings.value.voice = (e.target as HTMLSelectElement).value
  if (state.value === 'playing') speakAt(index())
}

onMounted(() => {
  supported.value = 'speechSynthesis' in window
  isIOS =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!supported.value) return
  const load = () => (voices.value = window.speechSynthesis.getVoices())
  load()
  window.speechSynthesis.addEventListener('voiceschanged', load) // voices often arrive late
})

watch(() => route.path, stop)
onBeforeUnmount(stop)
</script>

<template>
  <ClientOnly>
    <!-- Trigger (sits next to the share / graph buttons) -->
    <button
      v-if="supported"
      type="button"
      class="flex cursor-pointer items-center gap-1.5 rounded-full border border-purple-300/30 px-3 py-1.5 text-xs transition-colors hover:bg-purple-500/20 lg:text-sm"
      :class="state !== 'idle' ? 'bg-purple-500/20' : ''"
      aria-label="Nghe đọc ghi chú"
      @click="toggle"
    >
      <span
        :class="state === 'playing' ? 'i-solar:pause-bold' : 'i-solar:headphones-round-sound-linear'"
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
        <button class="cursor-pointer rounded-full p-2 hover:bg-purple-500/20" aria-label="Đoạn trước" @click="jump(-1)">
          <span class="i-solar:skip-previous-bold block" />
        </button>
        <button class="cursor-pointer rounded-full bg-purple-600 p-2 text-white" :aria-label="state === 'playing' ? 'Tạm dừng' : 'Tiếp tục'" @click="toggle">
          <span :class="state === 'playing' ? 'i-solar:pause-bold' : 'i-solar:play-bold'" class="block" />
        </button>
        <button class="cursor-pointer rounded-full p-2 hover:bg-purple-500/20" aria-label="Đoạn sau" @click="jump(1)">
          <span class="i-solar:skip-next-bold block" />
        </button>
        <button class="cursor-pointer rounded-full p-2 hover:bg-purple-500/20" aria-label="Dừng" @click="stop">
          <span class="i-solar:stop-bold block" />
        </button>
        <span class="px-1 text-xs tabular-nums opacity-70">{{ blockNow }}/{{ blockTotal }}</span>
        <button class="cursor-pointer rounded-full px-2 py-1 text-xs tabular-nums hover:bg-purple-500/20" aria-label="Tốc độ đọc" @click="cycleRate">
          {{ settings.rate }}×
        </button>
        <select
          v-if="viVoices.length > 1"
          class="max-w-28 rounded bg-transparent text-xs outline-none"
          :value="voice?.name"
          aria-label="Giọng đọc"
          @change="pickVoice"
        >
          <option v-for="v in viVoices" :key="v.name" :value="v.name">{{ v.name }}</option>
        </select>
        <span v-if="!viVoices.length" class="px-1 text-xs text-amber-500">Chưa có giọng tiếng Việt</span>
        <span v-if="hint" class="basis-full px-2 text-xs text-amber-500">{{ hint }}</span>
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
