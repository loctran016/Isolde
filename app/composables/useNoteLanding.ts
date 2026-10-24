// Scrolls to the heading a search hit pointed at, flashes it, and highlights the searched words.
// Only for navigation that starts from the search box: a click in the table of contents is left
// alone (the browser already scrolls there).

// What the search box hands over (the title lets us find the heading if its id doesn't match)
type Landing = { q: string; id: string; tick: number; title?: string }

export const useSearchLanding = () =>
  useState<Landing>('search-landing', () => ({ q: '', id: '', tick: 0 }))

const MARK = 'search-hit'
const STORE_KEY = 'note-search-landing' // the sessionStorage version of NoteSearch writes here

// Lowercase and strip Vietnamese diacritics, so "tieu hoa" also finds "Tiêu hoá"
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/đ/g, 'd')

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

// "/notes/a#x" and "/notes/a/#x" and the percent-encoded form all count as the same place
const samePlace = (a: string, b: string) => {
  const n = (s: string) => safeDecode(s).replace(/\/+(?=#|$)/, '')
  return n(a) === n(b)
}

function waitFor<T extends HTMLElement>(find: () => T | null, timeout = 4000): Promise<T | null> {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const look = () => {
      const el = find()
      if (el) return resolve(el)
      if (performance.now() - t0 > timeout) return resolve(null)
      requestAnimationFrame(look)
    }
    look()
  })
}

function findHeading(id: string, title?: string): HTMLElement | null {
  const byId = document.getElementById(id)
  if (byId) return byId
  if (!title) return null
  // the search plugin's anchor may differ from the heading's id, so fall back to the heading text
  const want = fold(title).trim()
  const all = document.querySelectorAll<HTMLElement>(
    '.markdown-body :is(h1, h2, h3, h4, h5, h6)',
  )
  for (const h of all) if (fold(h.textContent ?? '').trim() === want) return h
  return null
}

const level = (el: Element) => Number(/^H([1-6])$/.exec(el.tagName)?.[1] ?? 7)

// The heading plus everything under it, up to the next heading of the same or a higher level
function sectionRoots(h: HTMLElement): HTMLElement[] {
  const roots: HTMLElement[] = [h]
  const lvl = level(h)
  for (let n = h.nextElementSibling; n; n = n.nextElementSibling) {
    if (level(n) <= lvl) break
    roots.push(n as HTMLElement)
  }
  return roots
}

function clearHighlights() {
  if (typeof CSS !== 'undefined' && 'highlights' in CSS) (CSS as any).highlights.delete(MARK)
}

// Uses the CSS Custom Highlight API, so the page's DOM is never changed
function highlightIn(roots: HTMLElement[], q: string) {
  clearHighlights()
  const HighlightCtor = (globalThis as any).Highlight
  if (typeof CSS === 'undefined' || !('highlights' in CSS) || !HighlightCtor) return

  const terms = [
    ...new Set(
      fold(q)
        .split(/\s+/)
        .filter((t) => t.length >= 2),
    ),
  ].sort((a, b) => b.length - a.length)
  if (!terms.length) return
  const re = new RegExp(terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')

  const ranges: Range[] = []
  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node && ranges.length < 400; node = walker.nextNode()) {
      const text = node.nodeValue ?? ''
      // folded text plus a map back to positions in the original text
      let folded = ''
      const map: number[] = []
      for (let i = 0; i < text.length; i++) {
        for (const ch of fold(text[i])) {
          folded += ch
          map.push(i)
        }
      }
      for (const m of folded.matchAll(re)) {
        const start = map[m.index!]
        const end = map[m.index! + m[0].length - 1] + 1
        const r = new Range()
        r.setStart(node, start)
        r.setEnd(node, end)
        ranges.push(r)
      }
    }
  }
  if (ranges.length) (CSS as any).highlights.set(MARK, new HighlightCtor(...ranges))
}

function flash(el: HTMLElement) {
  el.classList.remove('search-flash')
  void el.offsetWidth // restart the animation
  el.classList.add('search-flash')
  setTimeout(() => el.classList.remove('search-flash'), 2800)
}

// A search hit that is waiting to be shown on this page, or null.
// It is taken once, so later clicks (TOC links and so on) never bring it back.
let consumedTick = 0
function takePending(landing: { value: Landing }, here: string): Landing | null {
  // 1. the shared state (set by NoteSearch)
  const s = landing.value
  if (s.id && s.tick !== consumedTick && samePlace(s.id, here)) {
    consumedTick = s.tick
    return { ...s }
  }
  // 2. sessionStorage (written by the sessionStorage version of NoteSearch)
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (raw) {
      const v = JSON.parse(raw)
      if (v?.id && samePlace(v.id, here)) {
        sessionStorage.removeItem(STORE_KEY)
        return { q: v.q ?? '', id: v.id, tick: 0, title: v.title }
      }
    }
  } catch {}
  return null
}

async function land(hit: Landing) {
  const hashAt = hit.id.indexOf('#')
  const id = hashAt >= 0 ? safeDecode(hit.id.slice(hashAt + 1)) : ''

  // a page-level hit has no heading: highlight over the whole note
  if (!id) {
    const root = await waitFor(() => document.querySelector<HTMLElement>('.markdown-body'))
    if (root) highlightIn([root], hit.q)
    return
  }

  const el = await waitFor(() => findHeading(id, hit.title))
  if (!el) {
    console.warn('[landing] heading not found for', id, hit.title)
    return
  }

  const jump = () => el.scrollIntoView({ block: 'start' })
  jump()
  // images above the heading load late and push it down, so correct once more
  setTimeout(() => {
    const top = el.getBoundingClientRect().top
    if (top < 0 || top > 160) jump()
  }, 700)

  flash(el)
  highlightIn(sectionRoots(el), hit.q)
}

// Violet, readable on both a light and a dark page (the text keeps its own colour)
const CSS_TEXT = `
::highlight(${MARK}){background-color:rgba(139,92,246,.5)}
.search-flash{animation:search-flash 2.6s ease-out;border-radius:.25rem}
@keyframes search-flash{
  0%,35%{background-color:rgba(139,92,246,.3);box-shadow:0 0 0 .45rem rgba(139,92,246,.3)}
  100%{background-color:transparent;box-shadow:0 0 0 .45rem transparent}
}`

// Call once in the note page's <script setup>
export function useNoteLanding() {
  const route = useRoute()
  const landing = useSearchLanding()

  useHead({ style: [{ key: 'note-landing-css', innerHTML: CSS_TEXT }] })

  async function run(initial = false) {
    const hit = takePending(landing, route.path + route.hash)
    if (hit) return land(hit)

    // a link opened straight at a heading (for example a shared link): just scroll there
    if (initial && route.hash) {
      const id = safeDecode(route.hash.slice(1))
      const el = await waitFor(() => document.getElementById(id))
      el?.scrollIntoView({ block: 'start' })
    }
  }

  const runSoon = useDebounceFn(() => run(), 40)
  const onEvent = () => runSoon()

  onMounted(() => {
    run(true)
    window.addEventListener('note-landing', onEvent) // sent by the sessionStorage version of NoteSearch
  })
  watch(() => landing.value.tick, runSoon) // picking another hit in the same note
  watch(() => route.hash, runSoon)
  onKeyStroke('Escape', clearHighlights)
  onBeforeUnmount(() => {
    window.removeEventListener('note-landing', onEvent)
    clearHighlights()
  })
}
