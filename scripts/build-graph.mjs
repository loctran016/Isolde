import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, sep, basename, dirname } from 'node:path'

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

function resolve(target, from) {
  const t = norm(
    decodeSafe(target)
      .replace(/\.md$/, '')
      .replace(/^\.?\//, ''),
  )
  const cands = (byName.get(t.split('/').at(-1)) ?? []).filter(
    (f) => !t.includes('/') || [norm(f.stem), norm(f.stripped)].some((s) => s.endsWith(t)),
  )
  if (!cands.length) return null
  const top = from.stem.split('/')[0]
  return cands.find((f) => f.stem.split('/')[0] === top) ?? cands[0] // prefer same subject
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
