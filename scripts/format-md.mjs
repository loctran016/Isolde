import fs from 'fs'
import path from 'path'

// Configuration
const TARGET_DIR = 'content/'
const EXTENSION = '.md'
const DRY_RUN = process.argv.includes('--dry') // node strip-heading-numbers.mjs --dry

// Typed numbering at the start of a heading, e.g.
//   "## 1. Foo"  "### 1.2. Foo"  "## II. Foo"  "## **III. Foo**"  "#### 2) Foo"
// Not matched: "## 1.5 mg" (needs ". " or ") " right after the number) and
// abbreviations like "## LDL. ..." (only I, V, X count as roman digits).
const NUMBER = String.raw`(?:(?=[IVX])X{0,3}(?:IX|IV|V?I{0,3})|\d+(?:\.\d+)*)[.)][ \t]+`
const HEADING = new RegExp(String.raw`^(#{1,6}[ \t]+)(\*\*|__)?${NUMBER}`)

function stripNumbers(content) {
  const lines = content.split('\n') // keeps \r on CRLF files, so line endings survive
  const changes = []
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

    // $1 = the hashes, $2 = the bold marker if there is one (empty otherwise)
    const next = line.replace(HEADING, '$1$2')
    if (next !== line) {
      changes.push([line.trim(), next.trim()])
      lines[i] = next
    }
  }
  return { text: lines.join('\n'), changes }
}

let files = 0
let headings = 0

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const { text, changes } = stripNumbers(content)
  if (!changes.length) return

  files++
  headings += changes.length
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${filePath}`)
  for (const [before, after] of changes) console.log(`   ${before}  ->  ${after}`)

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
  `Done: ${headings} heading(s) in ${files} file(s)${DRY_RUN ? ' (nothing written)' : ''}`,
)
