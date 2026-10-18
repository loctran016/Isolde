import fs from 'fs'
import path from 'path'

// Configuration
const TARGET_DIR = 'content/'
const EXTENSION = '.md'
const DRY_RUN = process.argv.includes('--dry') // node clean-notes.mjs --dry

// ---- Typed heading numbers ----
// "## 1. Foo"  "### 1.2. Foo"  "## II. Foo"  "## **III. Foo**"  "#### 2) Foo"
// Not matched: "## 1.5 mg" (needs ". " or ") " right after the number) and
// abbreviations like "## LDL. ..." (only I, V, X count as roman digits).
const NUMBER = String.raw`(?:(?=[IVX])X{0,3}(?:IX|IV|V?I{0,3})|\d+(?:\.\d+)*)[.)][ \t]+`
const HEADING = new RegExp(String.raw`^(#{1,6}[ \t]+)(\*\*|__)?${NUMBER}`)

// ---- Citation markers ----
// "[cite: 12]", "[cite: 3, 4]", "[cite: anything]": also eats the space before it,
// so "text [cite: 1]." becomes "text."
const CITE = /[ \t]*\[cite:[^\]]*\]/gi
// "[cite_start]" sits in front of the text it cites, so only the marker is removed
const CITE_START = /\[cite_start\]/gi

function clean(content) {
  const lines = content.split('\n') // keeps \r on CRLF files, so line endings survive
  const headingChanges = []
  let citeCount = 0
  let inFence = false
  let i = 0

  // Skip YAML frontmatter
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
    if (inFence) continue

    citeCount += (line.match(CITE)?.length ?? 0) + (line.match(CITE_START)?.length ?? 0)
    const noCites = line.replace(CITE, '').replace(CITE_START, '')

    // $1 = the hashes, $2 = the bold marker if there is one (empty otherwise)
    const final = noCites.replace(HEADING, '$1$2')
    if (final !== noCites) headingChanges.push([noCites.trim(), final.trim()])

    lines[i] = final
  }
  return { text: lines.join('\n'), headingChanges, citeCount }
}

let files = 0
let headings = 0
let cites = 0

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const { text, headingChanges, citeCount } = clean(content)
  if (text === content) return

  files++
  headings += headingChanges.length
  cites += citeCount
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${filePath}`)
  if (citeCount) console.log(`   ${citeCount} citation marker(s) removed`)
  for (const [before, after] of headingChanges) console.log(`   ${before}  ->  ${after}`)

  if (!DRY_RUN) fs.writeFileSync(filePath, text, 'utf8')
}

function walkDir(dir) {
  for (const file of fs.readdirSync(dir)) {
    // Skip dot folders (.git, .obsidian, ...) and node_modules
    if (file.startsWith('.') || file === 'node_modules') continue

    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) walkDir(filePath)
    else if (filePath.endsWith(EXTENSION)) processFile(filePath)
  }
}

console.log(`${DRY_RUN ? '[dry run] ' : ''}Starting in ${TARGET_DIR}...`)
walkDir(TARGET_DIR)
console.log(
  `Done: ${headings} heading(s), ${cites} citation(s) in ${files} file(s)${DRY_RUN ? ' (nothing written)' : ''}`,
)
