// Reads the prerendered notes and writes tts-manifest.json: every clip that has to exist.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseHTML } from 'linkedom'
import { collectChunks, TTS_VOICE } from './tts-text.mjs'

// Where the build wrote the prerendered pages (set TTS_HTML_DIR if yours differs)
const DIR = process.env.TTS_HTML_DIR ?? '.output/public'

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* htmlFiles(p)
    else if (name.endsWith('.html')) yield p
  }
}

const items = {}
let pages = 0
for (const file of htmlFiles(join(DIR, 'notes'))) {
  const { document } = parseHTML(readFileSync(file, 'utf8'))
  const root = document.querySelector('.markdown-body')
  if (!root) continue
  pages++
  for (const c of collectChunks(root)) items[c.id] = c.text // same text = same file, stored once
}

if (!pages) {
  console.error(
    `No notes found under ${DIR}/notes. Set TTS_HTML_DIR to the folder holding the prerendered HTML.`,
  )
  process.exit(1)
}

writeFileSync('tts-manifest.json', JSON.stringify({ voice: TTS_VOICE, items }))
console.log(`${pages} notes, ${Object.keys(items).length} distinct clips`)
