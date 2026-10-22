// Shared by the build-time extractor (Node) and the NoteSpeech component (browser),
// so both sides compute exactly the same text and the same audio file names.

// The VieNeu preset voice. Changing it changes every file name, so ALL audio is generated again.
// Others on the model card: Mai Anh, Ngọc Huyền, Phạm Tuyên (Bắc) · Kim Thanh, Thùy Dung, Minh Triết (Nam)
export const TTS_VOICE = 'Minh Quân'

// How abbreviations and symbols should be spoken. Extend these lists as you like.
// (HC is left out on purpose: it can mean "hội chứng" or "hồng cầu".)
export const ABBREVIATIONS = {
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

export const REPLACEMENTS = [
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

export function speakable(raw) {
  let s = raw.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (c) => c.normalize('NFKD')) // O₂ -> O2
  for (const [re, to] of REPLACEMENTS) s = s.replace(re, to)
  for (const [abbr, spoken] of Object.entries(ABBREVIATIONS))
    s = s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${abbr}(?![\\p{L}\\p{N}])`, 'gu'), spoken)
  return s
    .replace(/[*_`#|\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Long blocks are cut into sentence-sized pieces (also keeps each audio file short)
export function split(text, max = 200) {
  if (text.length <= max) return [text]
  const out = []
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

// cyrb53: a small hash that gives the same result in Node and in the browser
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** File name (without extension) of the audio for one piece of text. */
export const chunkId = (text) => cyrb53(`${TTS_VOICE}|${text.normalize('NFC')}`).toString(36)

// What gets read: headings, paragraphs, list items, summaries. Skipped: code, tables, diagrams,
// and anything marked data-no-tts.
const SKIP = 'table, pre, svg, .mermaid, .table-wrap, [data-no-tts]'

/**
 * @param {Element} root the rendered note (the .markdown-body element)
 * @returns {{ el: Element, text: string, block: number, id: string }[]}
 */
export function collectChunks(root) {
  const out = []
  let block = 0
  root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,summary').forEach((el) => {
    if (el.closest(SKIP)) return
    // read only this element's own text: nested lists and paragraphs are separate blocks
    const clone = el.cloneNode(true)
    clone
      .querySelectorAll('ul, ol, p, table, pre, svg, .mermaid, [data-no-tts]')
      .forEach((n) => n.remove())
    const text = speakable(clone.textContent ?? '')
    if (!text) return
    for (const part of split(text)) out.push({ el, text: part, block, id: chunkId(part) })
    block++
  })
  return out
}
