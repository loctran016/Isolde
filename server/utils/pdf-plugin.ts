// server/utils/pdf-plugin.ts
import { defineContentPlugin } from 'comark-content'
import { renderPdf } from 'comark-pdf'
import { join, dirname } from 'node:path'

interface PdfOptions {
  /** Same prefix as fs('./content', { prefix }) -- without slashes. */
  prefix?: string
  /** Folder that holds the markdown files on disk (images are read from here). */
  contentDir?: string
}

interface PdfMethods {
  pdf: (path: string) => Promise<{ bytes: Uint8Array; title: string } | null>
  pdfDebug: (path: string) => Promise<Record<string, unknown>>
}

const SYMBOLS: Record<string, string> = {
  '<=>': '⇔', '<->': '↔', '=>': '⇒', '->': '→', '<-': '←', '<=': '≤', '>=': '≥',
  '!=': '≠', '+/-': '±', '~=': '≈', '<==>': '⟺', '<-->': '⟷', '==>': '⟹',
  '-->': '⟶', '-->': '⟶', '<==': '⟸', '<--': '⟵',
}
const SYMBOL_RE = /<==>|<-->|<=>|<->|==>|-->|-->|<==|<--|\+\/-|<=|>=|!=|~=|=>|->|<-/g

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
const nfc = (s: string) => s.normalize('NFC')

// Raw Obsidian markdown -> markdown that comark-pdf understands
function prepare(md: string, imageDir: string): string {
  const absImg = (src: string) =>
    /^(https?:|data:|\/)/.test(src) ? src : join(imageDir, safeDecode(src))

  return md
    // ![[pic.png]] or ![[pic.png|300]]  ->  ![](abs path)
    .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_m, src: string) => `![](${absImg(src.trim())})`)
    // ![alt](pic.png)  ->  ![alt](abs path)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (_m, alt: string, src: string) =>
      `![${alt}](${absImg(src)})`,
    )
    // [[note|label]] -> label
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_m, target: string, alias?: string) =>
      alias?.trim() || target.split('/').at(-1)!.replace(/\.md$/i, '').replace(/^\d+\.(?=\D)\s*/, ''),
    )
    // symbol shortcuts outside fenced code blocks
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) => (i % 2 ? part : part.replace(SYMBOL_RE, (m) => SYMBOLS[m]!)))
    .join('')
}

export default defineContentPlugin<PdfOptions, PdfMethods>((options = {}) => {
  const prefix = (options.prefix ?? 'notes').replace(/^\/+|\/+$/g, '')
  const contentDir = options.contentDir ?? join(process.cwd(), 'content')
  const stripPrefix = (k: string) => nfc(k).replace(/^\/+/, '').replace(new RegExp(`^${prefix}/`), '')

  return {
    name: 'pdf',
    setup(content) {
      async function locate(path: string) {
        const info: Record<string, unknown> = { path }

        // 1) the parsed file (tries the path as given, then percent-decoded)
        let file: Awaited<ReturnType<typeof content.get>> | null | undefined
        for (const p of new Set([path, safeDecode(path)])) {
          file = await content.get(p)
          if (file) {
            info.matchedPath = p
            break
          }
        }
        info.foundFile = !!file
        if (!file) return { info }
        info.metaKey = file.meta.key
        info.metaSource = file.meta.source
        info.metaStem = file.meta.stem

        // 2) the raw markdown from the source
        const source = content.getSource(file.meta.source) ?? content.getSource()
        info.sourceAvailable = !!source
        if (!source) return { info, file }

        const afterInstance = file.meta.key.replace(/^[^/]+\//, '')
        const candidates = [...new Set([afterInstance, stripPrefix(afterInstance), file.meta.stem + file.meta.extension])]
        info.candidates = candidates

        let rawKey: string | undefined
        let raw: unknown
        for (const k of candidates) {
          try {
            raw = await source.getItem(k)
            if (raw) {
              rawKey = k
              break
            }
          } catch {}
        }

        // 3) last resort: search the source's own key list
        if (!raw) {
          try {
            const keys = await source.keys()
            info.sourceKeyCount = keys.length
            info.sampleKeys = keys.slice(0, 5)
            const want = stripPrefix(file.meta.stem + file.meta.extension)
            const hit = keys.find((k) => stripPrefix(k) === want || stripPrefix(k).endsWith(want))
            info.keyFromList = hit
            if (hit) {
              raw = await source.getItem(hit)
              if (raw) rawKey = hit
            }
          } catch (e) {
            info.keysError = String(e)
          }
        }

        info.rawFound = !!raw
        info.rawKey = rawKey
        info.rawLength = raw ? String(raw).length : 0
        return { info, file, raw: raw ? String(raw) : undefined, rawKey }
      }

      return {
        async pdfDebug(path) {
          const { info } = await locate(path)
          return info
        },

        async pdf(path) {
          const { info, file, raw, rawKey } = await locate(path)
          if (!file || !raw || !rawKey) {
            console.warn('[pdf] raw markdown not found:', JSON.stringify(info))
            return null
          }

          const title = file.meta.stem.split('/').at(-1)!.replace(/^\d+\.(?=\D)\s*/, '')
          const imageDir = join(contentDir, dirname(stripPrefix(rawKey)))

          const bytes = await renderPdf(prepare(raw, imageDir), {
            pdf: { format: 'A4', margin: '20mm', title, footer: 'Page {{ page }} of {{ totalPages }}' },
            visuals: { image: 'embed' },
          })
          return { bytes, title }
        },
      }
    },
  }
})