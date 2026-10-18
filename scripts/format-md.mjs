import fs from 'fs'
import path from 'path'

// Configuration
const TARGET_DIR = 'content/'
const EXTENSION = '.md'
const DRY_RUN = process.argv.includes('--dry') // node clean-notes.mjs --dry
const PLAIN = process.argv.includes('--plain') // LaTeX -> chữ thường, không bọc `code`
const NUMERIC_CITES = process.argv.includes('--cites') // xoá thêm [1], [2, 7], [4-6]

// ---------- 1. Số gõ tay ở đầu heading ----------
// "## 1. Foo"  "### 1.2. Foo"  "## II. Foo"  "## **III. Foo**"  "#### 2) Foo"
const NUMBER = String.raw`(?:(?=[IVX])X{0,3}(?:IX|IV|V?I{0,3})|\d+(?:\.\d+)*)[.)][ \t]+`
const HEADING = new RegExp(String.raw`^(#{1,6}[ \t]+)(\*\*|__)?${NUMBER}`)

// ---------- 2. Citation ----------
const CITE = /[ \t]*\[cite:[^\]]*\]/gi
const CITE_START = /\[cite_start\]/gi
// [1]  [2, 7]  [4-6]  (không đụng [[wikilink]], [text](url), [1]: footnote)
const NUM_CITE = /[ \t]*(?<!\[)\[\d+(?:\s*[,–-]\s*\d+)*\](?!\]|\(|:)/g

// ---------- 3. LaTeX -> chữ + ký hiệu ----------
// Chỉ đổi dạng \( ... \) và \[ ... \] (NotebookLM hay xuất kiểu này).
// $...$ và $$...$$ được giữ nguyên, để sau này bạn còn dùng LaTeX thật.
const SYMBOLS = {
  ge: '≥', geq: '≥', geqslant: '≥', le: '≤', leq: '≤', leqslant: '≤',
  gg: '≫', ll: '≪', ne: '≠', neq: '≠', approx: '≈', sim: '~', equiv: '≡', propto: '∝',
  pm: '±', mp: '∓', times: '×', cdot: '·', div: '÷',
  to: '→', rightarrow: '→', longrightarrow: '→', leftarrow: '←', leftrightarrow: '↔',
  Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', implies: '⇒', iff: '⇔',
  uparrow: '↑', downarrow: '↓',
  circ: '°', degree: '°', infty: '∞', ldots: '…', dots: '…', cdots: '…', therefore: '∴',
  mu: 'µ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ',
  epsilon: 'ε', varepsilon: 'ε', theta: 'θ', lambda: 'λ', pi: 'π', rho: 'ρ',
  sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', omega: 'ω', Omega: 'Ω', kappa: 'κ', eta: 'η',
  lt: '<', gt: '>', quad: ' ', qquad: ' ',
}
const SYMBOL_RE = new RegExp(
  String.raw`\\(${Object.keys(SYMBOLS).sort((a, b) => b.length - a.length).join('|')})(?![A-Za-z])`,
  'g',
)

const mapChars = (from, to) => Object.fromEntries([...from].map((c, i) => [c, [...to][i]]))
const SUP = { ...mapChars('0123456789+-()ni', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ⁿⁱ'), '−': '⁻' }
const SUB = { ...mapChars('0123456789+-()', '₀₁₂₃₄₅₆₇₈₉₊₋₍₎'), '−': '₋' }
// Không chuyển được hết thì giữ dạng ^x / _x (ví dụ V_max)
const script = (map, mark) => (_m, braced, bare) => {
  const body = (braced ?? bare).trim()
  const chars = [...body].map((c) => map[c])
  return body && chars.every(Boolean) ? chars.join('') : `${mark}${body}`
}
const SUP_RE = /\^\s*(?:\{([^{}]*)\}|([0-9A-Za-z+\-−]))/g
const SUB_RE = /_\s*(?:\{([^{}]*)\}|([0-9A-Za-z]))/g

const WRAPPERS =
  /\\(?:textbf|textit|textrm|text|mathrm|mathbf|mathit|mathcal|boldsymbol|operatorname|mbox)\s*\{([^{}]*)\}/g
const FRAC = /\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g
const SQRT = /\\sqrt\s*\{([^{}]*)\}/g
const wrapFrac = (t) => (/[\s+\-−×·/]/.test(t.trim()) ? `(${t.trim()})` : t.trim())

function texToText(src) {
  let s = src
  // ký tự escape tạm thời thành placeholder
  s = s.replace(/\\\{/g, '\u0001').replace(/\\\}/g, '\u0002').replace(/\\_/g, '\u0003')
  s = s.replace(/\{,\}/g, ',') // 1{,}6 -> 1,6
  s = s.replace(/\^\s*\{?\s*\\circ(?![A-Za-z])\s*\}?/g, '°') // 40^\circ , 40^{\circ}
  s = s.replace(SYMBOL_RE, (_m, name) => SYMBOLS[name]) // phải chạy trước khi gỡ \text{...}
  s = s.replace(/\\([%&#$])/g, '$1')
  s = s.replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|big|Big)(?![A-Za-z])\s*/g, '')

  let prev
  do {
    prev = s
    s = s.replace(WRAPPERS, '$1')
    s = s.replace(FRAC, (_m, a, b) => `${wrapFrac(a)}/${wrapFrac(b)}`)
    s = s.replace(SQRT, (_m, a) => `√${wrapFrac(a)}`)
  } while (s !== prev)

  s = s.replace(/\\[,;:! ]/g, ' ')
  s = s.replace(SUP_RE, script(SUP, '^')).replace(SUB_RE, script(SUB, '_'))
  s = s.replace(/[{}]/g, '')
  s = s.replace(/~\s+(?=\d)/g, '~').replace(/\s+/g, ' ').trim()
  return s.replace(/\u0001/g, '{').replace(/\u0002/g, '}').replace(/\u0003/g, '_')
}

const code = (s) => (s.includes('`') ? `\`\` ${s} \`\`` : `\`${s}\``)

function convertMath(line, inFence, ctx) {
  const out = (body) => {
    const t = texToText(body)
    ctx.math++
    if (ctx.samples.length < 3) ctx.samples.push([body.trim(), t])
    for (const m of t.match(/\\[A-Za-z]+/g) ?? []) ctx.unknown.add(m)
    return inFence || PLAIN ? t : code(t)
  }
  // Trong code block chỉ đổi khi có lệnh LaTeX thật (có dấu \), để không phá code
  const ok = (b) => !inFence || /\\/.test(b)

  const convert = (text) =>
    text
      .replace(/\\{1,2}\((.+?)\\{1,2}\)/g, (m, b) => (ok(b) ? out(b) : m)) // \( ... \)  và  \\( ... \\)
      .replace(/\\\\\[(.+?)\\\\\]/g, (m, b) => (ok(b) ? out(b) : m)) //          \\[ ... \\]

  if (inFence) return convert(line)
  // không đụng vào `inline code` có sẵn
  return line
    .split(/(`[^`\n]*`)/)
    .map((part, i) => (i % 2 ? part : convert(part)))
    .join('')
}

// ---------- Xử lý một file ----------
function clean(content) {
  const lines = content.split('\n') // giữ \r ở file CRLF
  const ctx = { math: 0, cites: 0, numCites: 0, unknown: new Set(), leftovers: [], samples: [] }
  const headingChanges = []
  let inFence = false
  let i = 0

  // Bỏ qua YAML frontmatter
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((l, idx) => idx > 0 && l.trim() === '---')
    if (end > 0) i = end + 1
  }

  for (; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s{0,3}(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      lines[i] = convertMath(line, true, ctx)
      continue
    }

    let next = line
    ctx.cites += (next.match(CITE)?.length ?? 0) + (next.match(CITE_START)?.length ?? 0)
    next = next.replace(CITE, '').replace(CITE_START, '')
    if (NUMERIC_CITES) {
      ctx.numCites += next.match(NUM_CITE)?.length ?? 0
      next = next.replace(NUM_CITE, '')
    }

    next = convertMath(next, false, ctx)
    // còn sót dấu mở \( (ví dụ công thức bị ngắt qua nhiều dòng) thì báo lại
    if (/\\{1,2}\(/.test(next.replace(/`[^`\n]*`/g, ''))) ctx.leftovers.push(i + 1)

    const final = next.replace(HEADING, '$1$2') // $1 = dấu #, $2 = ** nếu có
    if (final !== next) headingChanges.push([next.trim(), final.trim()])
    lines[i] = final
  }
  return { text: lines.join('\n'), headingChanges, ctx }
}

let files = 0
let totals = { headings: 0, cites: 0, math: 0 }

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const { text, headingChanges, ctx } = clean(content)
  const cites = ctx.cites + ctx.numCites
  if (text === content && !ctx.leftovers.length) return

  if (text !== content) files++
  totals.headings += headingChanges.length
  totals.cites += cites
  totals.math += ctx.math

  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${filePath}`)
  if (cites) console.log(`   ${cites} citation marker(s) removed`)
  if (ctx.math) console.log(`   ${ctx.math} formula(s) converted`)
  if (DRY_RUN) for (const [from, to] of ctx.samples) console.log(`      ${from}  =>  ${to}`)
  for (const [before, after] of headingChanges) console.log(`   ${before}  ->  ${after}`)
  if (ctx.unknown.size) console.log(`   ⚠ LaTeX command(s) not converted: ${[...ctx.unknown].join(' ')}`)
  if (ctx.leftovers.length) console.log(`   ⚠ LaTeX left at line(s): ${ctx.leftovers.join(', ')}`)

  if (!DRY_RUN && text !== content) fs.writeFileSync(filePath, text, 'utf8')
}

function walkDir(dir) {
  for (const file of fs.readdirSync(dir)) {
    // Bỏ qua thư mục ẩn (.git, .obsidian, ...) và node_modules
    if (file.startsWith('.') || file === 'node_modules') continue

    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) walkDir(filePath)
    else if (filePath.endsWith(EXTENSION)) processFile(filePath)
  }
}

console.log(`${DRY_RUN ? '[dry run] ' : ''}Starting in ${TARGET_DIR}...`)
walkDir(TARGET_DIR)
console.log(
  `Done: ${totals.headings} heading(s), ${totals.cites} citation(s), ${totals.math} formula(s) in ${files} file(s)${DRY_RUN ? ' (nothing written)' : ''}`,
)
