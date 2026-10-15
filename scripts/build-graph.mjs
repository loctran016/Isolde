import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, sep, basename, dirname, posix } from 'node:path'

const CONTENT_DIR = 'content' // the folder that directly holds "Nội khoa/", "Tiêu hoá/", ...
const OUT = 'public/graph.json'

const stripPrefix = (s) => s.replace(/^\d+\.(?=\D)\s*/, '')
const norm = (s) => s.normalize('NFC').toLowerCase().trim()
const decodeSafe = (s) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.')) return []
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : e.name.endsWith('.md') ? [p] : []
  })
}

const files = walk(CONTENT_DIR).map((p) => {
  const stem = relative(CONTENT_DIR, p).split(sep).join('/').replace(/\.md$/, '')
  return {
    p,
    stem,
    stripped: stem.split('/').map(stripPrefix).join('/'),
    name: stripPrefix(basename(stem)),
  }
})

// Obsidian resolves [[Name]] by file name anywhere in the vault
const byName = new Map()
for (const f of files) {
  for (const k of new Set([norm(basename(f.stem)), norm(f.name)]))
    byName.set(k, [...(byName.get(k) ?? []), f])
}

const byStem = new Map(
  files.flatMap((f) => [
    [norm(f.stem), f],
    [norm(f.stripped), f],
  ]),
)

function resolve(target, from) {
  const raw = decodeSafe(target).replace(/\.md$/i, '').trim()

  // Path-style links: relative ("../x/y") or from the vault root ("x/y")
  if (raw.includes('/')) {
    const dir = posix.dirname(from.stem)
    for (const c of [posix.join(dir, raw), posix.normalize(raw)]) {
      const hit = byStem.get(norm(posix.normalize(c)))
      if (hit) return hit
    }
  }

  // Bare names: look the file up anywhere, preferring the same subject folder
  const cands = byName.get(norm(raw.split('/').at(-1))) ?? []
  if (!cands.length) return null
  const top = from.stem.split('/')[0]
  return cands.find((f) => f.stem.split('/')[0] === top) ?? cands[0]
}

const WIKI = /(?<!!)\[\[([^\]|#]+?)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g
const MD = /(?<!!)\[[^\]]*\]\(([^)#\s]+?\.md)(?:#[^)]*)?\)/g

const seen = new Set()
const links = []
for (const f of files) {
  const text = readFileSync(f.p, 'utf8')
    .replace(/^---[\s\S]*?\n---/, '')
    .replace(/```[\s\S]*?```/g, '')
  for (const re of [WIKI, MD]) {
    for (const m of text.matchAll(re)) {
      const to = resolve(m[1], f)
      if (!to || to.stem === f.stem) continue
      const key = `${f.stem}>${to.stem}`
      if (seen.has(key)) continue
      seen.add(key)
      links.push({ source: f.stem, target: to.stem })
    }
  }
}

const nodes = files.map((f) => ({
  id: f.stem,
  name: f.name,
  group: stripPrefix(f.stem.split('/')[0]),
}))

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ nodes, links }))
console.log(`graph: ${nodes.length} notes, ${links.length} links`)
