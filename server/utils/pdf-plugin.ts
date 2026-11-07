// server/utils/pdf-plugin.ts
import { defineContentPlugin } from 'comark-content'
import { renderPdf } from 'comark-pdf'
import { posix } from 'node:path'

interface PdfOptions {
  /** Same prefix as fs('./content', { prefix }) -- without slashes. */
  prefix?: string
  /** Nitro server-assets storage that holds the raw .md and image files (see nuxt.config). */
  assets?: string
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

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml',
}

// ---- Vietnamese-capable font (server only, read lazily on the first PDF export) ----
// jasy needs real TTF/OTF bytes (not the woff2 subsets that @nuxtjs/google-fonts downloads).
// The files live in server/assets/fonts/ and are bundled into the server function only:
// the browser never downloads them and nothing is read when a page loads.
const FONT_FAMILY = 'Be Vietnam Pro'
const FONT_FILES = {
  regular: 'BeVietnamPro-Regular.ttf',
  bold: 'BeVietnamPro-Bold.ttf', // swap for 'BeVietnamPro-SemiBold.ttf' to get a lighter "bold"
  italic: 'BeVietnamPro-Italic.ttf',
  boldItalic: 'BeVietnamPro-BoldItalic.ttf',
}

type FontsOption = Record<string, Uint8Array | Record<string, Uint8Array>>

let fontError: string | undefined
let fontCache: Promise<{ full: FontsOption; regularOnly: FontsOption } | undefined> | undefined
function loadFonts() {
  fontCache ??= (async () => {
    try {
      const { useStorage } = await import('nitropack/runtime')
      const st = useStorage('assets:pdf-fonts')
      const read = async (file: string) => {
        try {
          const raw = await st.getItemRaw(file)
          return raw ? new Uint8Array(raw as ArrayBuffer) : undefined
        } catch {
          return undefined
        }
      }
      const [regular, bold, italic, boldItalic] = await Promise.all([
        read(FONT_FILES.regular),
        read(FONT_FILES.bold),
        read(FONT_FILES.italic),
        read(FONT_FILES.boldItalic),
      ])
      if (!regular) throw new Error(`${FONT_FILES.regular} not found in server/assets/fonts`)

      // jasy's documented shape: { normal, bold?, italic?, boldItalic? }
      const faces: Record<string, Uint8Array> = { normal: regular }
      if (bold) faces.bold = bold
      if (italic) faces.italic = italic
      if (boldItalic) faces.boldItalic = boldItalic

      console.log('[pdf] fonts loaded:', Object.keys(faces).join(', '))
      return { full: { [FONT_FAMILY]: faces }, regularOnly: { [FONT_FAMILY]: regular } }
    } catch (e) {
      fontError = String(e)
      console.warn('[pdf] custom font not loaded, falling back to Helvetica (no Vietnamese):', e)
      fontCache = undefined // retry on the next export
      return undefined
    }
  })()
  return fontCache
}

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
const nfc = (s: string) => s.normalize('NFC')

const toText = (v: unknown): string => {
  if (typeof v === 'string') return v
  if (v == null) return ''
  if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) return new TextDecoder().decode(v as ArrayBufferView)
  return String(v)
}

async function replaceAsync(s: string, re: RegExp, fn: (...m: string[]) => Promise<string>) {
  const jobs: Promise<string>[] = []
  s.replace(re, (...m) => {
    jobs.push(fn(...(m as string[])))
    return ''
  })
  const out = await Promise.all(jobs)
  let i = 0
  return s.replace(re, () => out[i++]!)
}

export default defineContentPlugin<PdfOptions, PdfMethods>((options = {}) => {
  const prefix = (options.prefix ?? 'notes').replace(/^\/+|\/+$/g, '')
  const assets = options.assets ?? 'assets:notes-raw'
  const stripPrefix = (k: string) => nfc(k).replace(/^\/+/, '').replace(new RegExp(`^${prefix}/`), '')
  // storage keys use ":" as the folder separator
  const normKey = (k: string) => stripPrefix(k.replaceAll(':', '/'))

  return {
    name: 'pdf',
    setup(content) {
      async function openStorage() {
        const { useStorage } = await import('nitropack/runtime')
        const st = useStorage(assets)
        const keys = await st.getKeys()
        return { st, keys, byNorm: new Map(keys.map((k) => [normKey(k), k])) }
      }

      async function locate(path: string) {
        const info: Record<string, unknown> = { path }

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
        info.metaStem = file.meta.stem

        const want = stripPrefix(file.meta.stem + file.meta.extension)
        info.want = want

        // 1) raw files bundled as Nitro server assets (works on Vercel)
        let raw = ''
        let rawKey: string | undefined
        let store: Awaited<ReturnType<typeof openStorage>> | undefined
        try {
          store = await openStorage()
          info.assetKeyCount = store.keys.length
          info.sampleAssetKeys = store.keys.slice(0, 5)
          const hit =
            store.byNorm.get(want) ??
            [...store.byNorm.keys()].find((k) => k.endsWith(`/${want}`) || want.endsWith(`/${k}`))
          if (hit) {
            rawKey = hit
            raw = toText(await store.st.getItem(store.byNorm.get(hit) ?? hit))
          }
        } catch (e) {
          info.assetsError = String(e)
        }

        // 2) fallback: the content source itself (works in dev, not when only a snapshot is deployed)
        if (!raw) {
          const source = content.getSource(file.meta.source) ?? content.getSource()
          info.sourceAvailable = !!source
          if (source) {
            const afterInstance = file.meta.key.replace(/^[^/]+\//, '')
            for (const k of new Set([afterInstance, stripPrefix(afterInstance), file.meta.stem + file.meta.extension])) {
              try {
                const r = toText(await source.getItem(k))
                if (r) {
                  raw = r
                  rawKey = stripPrefix(k)
                  break
                }
              } catch {}
            }
          }
        }

        info.rawFound = !!raw
        info.rawKey = rawKey
        info.rawLength = raw.length
        return { info, file, raw, rawKey, store }
      }

      return {
        async pdfDebug(path) {
          const { info } = await locate(path)
          const fonts = await loadFonts()

          // jasy sometimes cannot move the block that follows a table to the next page and then
          // overflows (or draws over the footer). Where the page breaks fall depends on the margin
          // and gap, so try a few slightly different layouts before giving up.
          const ATTEMPTS: { bottom?: number; gap?: number }[] = [{}]
          for (const bottom of [20, 20.7, 21.4, 22.1, 19.3, 22.8, 18.6, 23.5])
            for (const gap of [8, 7.3, 8.7]) ATTEMPTS.push({ bottom, gap })

          const render = (fontsOption: FontsOption | undefined, at: { bottom?: number; gap?: number }, overflow: 'error' | 'warn') =>
            renderPdf(md, {
              ...(fontsOption ? { fonts: fontsOption as any } : {}),
              pdf: {
                ...(fontsOption ? { font: FONT_FAMILY } : {}),
                format: 'A4',
                margin:
                  at.bottom === undefined
                    ? '20mm'
                    : { top: '20mm', left: '20mm', right: '20mm', bottom: `${at.bottom}mm` },
                ...(at.gap === undefined ? {} : { gap: at.gap }),
                title,
                footer: 'Page {{ page }} of {{ totalPages }}',
                onOverflow: overflow,
              },
              visuals: { image: 'embed' },
            })

          const renderFit = async (fontsOption?: FontsOption) => {
            for (const at of ATTEMPTS) {
              try {
                return await render(fontsOption, at, 'error')
              } catch (err) {
                if (!/Layout overflow/i.test(String((err as Error)?.message ?? err))) throw err
              }
            }
            console.warn('[pdf] every layout overflowed, rendering with clipping')
            return render(fontsOption, {}, 'warn')
          }

          let bytes: Uint8Array
          try {
            bytes = await renderFit(fonts?.full)
          } catch (err) {
            if (!fonts) throw err
            // bold/italic faces rejected -> retry with the regular face only
            console.warn('[pdf] render with bold/italic faces failed, retrying regular only:', err)
            bytes = await renderFit(fonts.regularOnly)
          }
          return { bytes, title }
        },
      }
    },
  }
})