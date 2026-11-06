// server/utils/pdf-plugin.ts
import { defineContentPlugin } from 'comark-content'
import { renderPdf } from 'comark-pdf'

interface PdfMethods {
  pdf: (path: string) => Promise<{ bytes: Uint8Array; title: string } | null>
}

const SYMBOLS: Record<string, string> = {
  '<=>': '⇔', '<->': '↔', '=>': '⇒', '->': '→', '<-': '←', '<=': '≤', '>=': '≥',
  '!=': '≠', '+/-': '±', '~=': '≈', '<==>': '⟺', '<-->': '⟷', '==>': '⟹',
  '-->': '⟶', '-->': '⟶', '<==': '⟸', '<--': '⟵',
}
const SYMBOL_RE = /<==>|<-->|<=>|<->|==>|-->|-->|<==|<--|\+\/-|<=|>=|!=|~=|=>|->|<-/g

// Raw Obsidian markdown -> plain markdown the PDF renderer understands
function prepare(md: string): string {
  return md
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_m, target: string, alias?: string) =>
      (alias?.trim() || target.split('/').at(-1)!.replace(/\.md$/i, '').replace(/^\d+\.(?=\D)\s*/, '')),
    )
    // symbol shortcuts outside fenced code blocks
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) => (i % 2 ? part : part.replace(SYMBOL_RE, (m) => SYMBOLS[m]!)))
    .join('')
}

export default defineContentPlugin<{}, PdfMethods>(() => ({
  name: 'pdf',
  setup(content) {
    return {
      async pdf(path) {
        const file = await content.get(path)
        if (!file) return null

        // ASSUMPTION: meta.key looks like 'default/Tiêu hoá/Sinh lý/Note.md' (instance name first).
        // If your source uses a prefix, adjust this line.
        const key = file.meta.key.replace(/^[^/]+\//, '')
        const raw = await content.getSource(file.meta.source)?.getItem(key)
        if (!raw) return null

        const title = file.meta.stem.split('/').at(-1)!.replace(/^\d+\.(?=\D)\s*/, '')
        const bytes = await renderPdf(prepare(String(raw)), {
          pdf: { format: 'A4', margin: '20mm', title, footer: 'Page {{ page }} of {{ totalPages }}' },
        })
        return { bytes, title }
      },
    }
  },
}))
