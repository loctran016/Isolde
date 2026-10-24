// Remembers the last search ("what did I type, which hit did I pick") across the navigation
type Landing = { q: string; id: string; tick: number }

export const useSearchLanding = () =>
  useState<Landing>('search-landing', () => ({ q: '', id: '', tick: 0 }))

const MARK = 'search-hit'

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

function waitFor(id: string, timeout = 4000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const look = () => {
      const el = document.getElementById(id)
      if (el) return resolve(el)
      if (performance.now() - t0 > timeout) return resolve(null)
      requestAnimationFrame(look)
    }
    look()
  })
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
function highlightTerms(heading: HTMLElement, q: string) {
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
  for (const root of sectionRoots(heading)) {
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

async function land(hash: string, q: string) {
  const id = safeDecode(hash.replace(/^#/, ''))
  if (!id) return
  const el = await waitFor(id)
  if (!el) return

  const jump = () => el.scrollIntoView({ block: 'start' })
  jump()
  // images above the heading load late and push it down, so correct once more
  setTimeout(() => {
    const top = el.getBoundingClientRect().top
    if (top < 0 || top > 160) jump()
  }, 700)

  flash(el)
  highlightTerms(el, q)
}

const CSS_TEXT = `
::highlight(${MARK}){background-color:rgba(109, 40, 217,.55);color:#1c1917}
.search-flash{animation:search-flash 2.6s ease-out;border-radius:.25rem}
@keyframes search-flash{
  0%,35%{background-color:rgba(250,204,21,.35);box-shadow:0 0 0 .45rem rgba(250,204,21,.35)}
  100%{background-color:transparent;box-shadow:0 0 0 .45rem transparent}
}`

// Call once in the note page's <script setup>
export function useNoteLanding() {
  const route = useRoute()
  const landing = useSearchLanding()

  useHead({ style: [{ key: 'note-landing-css', innerHTML: CSS_TEXT }] })

  // Highlight the search terms only when this page was opened from that exact search hit
  const fromSearch = () => safeDecode(landing.value.id) === safeDecode(route.path + route.hash)

  const run = useDebounceFn(() => {
    if (!route.hash) return
    land(route.hash, fromSearch() ? landing.value.q : '')
  }, 40)

  onMounted(() => run())
  watch(
    () => landing.value.tick,
    () => run(),
  ) // picking another hit in the same note
  watch(
    () => route.hash,
    () => run(),
  )
  onKeyStroke('Escape', clearHighlights)
  onBeforeUnmount(clearHighlights)
}
