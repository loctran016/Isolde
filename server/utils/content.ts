// server/utils/content.ts
import { comarkContent } from 'comark-content'
import { defineComarkPlugin } from 'comark/parse'
import media from 'comark-content/plugins/media'
import fs from 'comark-content/sources/fs'
import mermaid from 'comark/plugins/mermaid'
import toc from 'comark/plugins/toc'
import { withSnapshot } from 'comark-content/sources/snapshot'
import markdownItMultiMDTable from 'markdown-it-multimd-table'
import markdownItSup from 'markdown-it-sup'

import sqliteWasm from 'comark-content/database/sqlite-wasm'
import sqliteFullTextSearch from 'comark-content/plugins/sqlite-full-text-search'
import pdf from './pdf-plugin'

const multiMDTable = defineComarkPlugin(() => ({
  name: 'multiMDTable',
  markdownItPlugins: [markdownItMultiMDTable],
}))

const subscript = defineComarkPlugin(() => ({
  name: 'subscript',
  post(state) {
    state.tree.nodes = state.tree.nodes.flatMap(parseSubscript)
  },
}))

const superscript = defineComarkPlugin(() => ({
  name: 'superscript',
  markdownItPlugins: [markdownItSup],
}))

export const content = comarkContent({
  source: withSnapshot(
    fs('./content', { prefix: '/notes' }),
    () =>
      import('nitropack/runtime').then(({ useStorage }) =>
        useStorage('assets:comark').getItem('default/snapshot.json'),
      ),
    () =>
      import('nitropack/runtime').then(({ useStorage }) =>
        useStorage('assets:comark').getItem('default/manifest.json'),
      ),
  ),
  markdown: {
    plugins: [mermaid(), toc(), multiMDTable(), subscript(), superscript()],
  },
  plugins: [media(), sqliteFullTextSearch({ database: sqliteWasm() }), pdf({ prefix: 'notes', assets: 'assets:notes-raw' })],
})

// GET /api/content/pdf?path=/notes/...   (add &debug=1 to see how the raw markdown was looked up)
content.addServeHandler('pdf', async (request) => {
  const url = new URL(request.url)
  const path = url.searchParams.get('path') ?? ''
  try {
    if (url.searchParams.has('debug')) return Response.json(await content.pdfDebug(path))

    const out = await content.pdf(path)
    if (!out) {
      return new Response(`PDF: raw markdown not found for "${path}". Open the same URL with &debug=1`, {
        status: 404,
      })
    }
    return new Response(out.bytes as BodyInit, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="note.pdf"; filename*=UTF-8''${encodeURIComponent(out.title)}.pdf`,
      },
    })
  } catch (err) {
    console.error('[pdf] render failed:', err)
    return new Response(`PDF render failed: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
    })
  }
})

import type { Node } from 'comark'

function parseSubscript(node: Node): Node[] {
  if (typeof node === 'string') {
    const nodes: Node[] = []

    for (const [index, part] of Object.entries(node.split(/~([^~\n]+)~/u))) {
      if (part) {
        const isEvenIndex = Number(index) % 2 === 0
        nodes.push(isEvenIndex ? part : ['sub', {}, part])
      }
    }

    return nodes
  }

  const [tag, props, ...children] = node

  // Comment node: [null, attrs, content] -- don't split its body.
  if (tag === null) return [node]

  return [[tag, props ?? {}, ...children.flatMap(parseSubscript)]]
}