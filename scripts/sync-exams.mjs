#!/usr/bin/env bun
// Đồng bộ đề thi: content/exams -> public/data/exams
//
// Chạy:
//   bun scripts/sync-exams.mjs            # copy file mới/đã đổi
//   bun scripts/sync-exams.mjs --dry-run  # chỉ in ra, không ghi gì
//   bun scripts/sync-exams.mjs --prune    # xoá file ở đích không còn trong nguồn
//   bun scripts/sync-exams.mjs --quiet    # chỉ in tóm tắt

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'content', 'exams')
const DEST = path.join(ROOT, 'public', 'data', 'exams')

const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry-run')
const PRUNE = args.has('--prune')
const QUIET = args.has('--quiet')

const IGNORED = new Set(['.DS_Store', 'Thumbs.db'])
const log = (...a) => { if (!QUIET) console.log(...a) }
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/')

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}

/** Liệt kê đệ quy mọi file (đường dẫn tương đối so với root). Bỏ qua file/thư mục ẩn. */
async function listFiles(root, dir = root) {
  const out = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || IGNORED.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await listFiles(root, full))
    else if (entry.isFile()) out.push(path.relative(root, full))
  }
  return out
}

/** Cần copy khi đích chưa có, khác kích thước, hoặc nguồn mới hơn. */
async function needsCopy(src, dest) {
  let d
  try { d = await fs.stat(dest) } catch { return true }
  const s = await fs.stat(src)
  return s.size !== d.size || s.mtimeMs - d.mtimeMs > 1
}

async function removeEmptyDirs(dir, stopAt) {
  if (dir === stopAt) return
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) await removeEmptyDirs(path.join(dir, entry.name), stopAt)
  }
  if ((await fs.readdir(dir)).length === 0 && dir !== stopAt) {
    log(`  xoá thư mục rỗng: ${rel(dir)}`)
    if (!DRY) await fs.rmdir(dir)
  }
}

async function main() {
  if (!(await exists(SRC))) {
    log(`[sync-exams] Không có ${rel(SRC)}, bỏ qua.`)
    return
  }

  const srcFiles = await listFiles(SRC)
  let copied = 0
  let skipped = 0

  for (const file of srcFiles) {
    const src = path.join(SRC, file)
    const dest = path.join(DEST, file)
    if (await needsCopy(src, dest)) {
      log(`  ${DRY ? '[dry] ' : ''}copy: ${file}`)
      if (!DRY) {
        await fs.mkdir(path.dirname(dest), { recursive: true })
        await fs.copyFile(src, dest)
        // Giữ mtime của nguồn để lần chạy sau so sánh đúng
        const s = await fs.stat(src)
        await fs.utimes(dest, s.atime, s.mtime)
      }
      copied++
    } else {
      skipped++
    }
  }

  let pruned = 0
  if (PRUNE && (await exists(DEST))) {
    const keep = new Set(srcFiles)
    for (const file of await listFiles(DEST)) {
      if (!keep.has(file)) {
        log(`  ${DRY ? '[dry] ' : ''}xoá: ${file}`)
        if (!DRY) await fs.unlink(path.join(DEST, file))
        pruned++
      }
    }
    await removeEmptyDirs(DEST, DEST)
  }

  console.log(
    `[sync-exams] ${rel(SRC)} -> ${rel(DEST)}: ${copied} copy, ${skipped} giữ nguyên` +
    (PRUNE ? `, ${pruned} xoá` : '') + (DRY ? ' (dry-run)' : '')
  )
}

main().catch((err) => {
  console.error('[sync-exams] Lỗi:', err)
  process.exit(1)
})
