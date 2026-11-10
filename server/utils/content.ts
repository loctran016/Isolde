// server/utils/content.ts
import { comarkContent } from 'comark-content'
import { defineComarkPlugin } from 'comark/parse'
import media from 'comark-content/plugins/media'
import fs from 'comark-content/sources/fs'
import mermaid from 'comark/plugins/mermaid'
import toc from 'comark/plugins/toc'
import { withSnapshot } from 'comark-content/sources/snapshot'
import markdownItMultiMDTable from 'markdown-it-multimd-table'
import comarkUi from 'comark-ui/html' // server side: use the framework-free entry, not comark-ui/vue

import sqliteWasm from 'comark-content/database/sqlite-wasm'
import sqliteFullTextSearch from 'comark-content/plugins/sqlite-full-text-search'
import pdf from './pdf-plugin'

// Only the parse plugins are needed here; the components are registered on the page.
// comark-ui also ships its own mermaid (Pele), mark (^sup^, ==mark==), footnotes, math...
// If something in your notes changes after adding it, pass `false` for that plugin here.
const { plugins: comarkUiPlugins } = comarkUi()

const multiMDTable = defineComarkPlugin(() => ({
  name: 'multiMDTable',
  markdownItPlugins: [markdownItMultiMDTable],
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
    plugins: [
      ...comarkUiPlugins,
      mermaid(),
      toc(),
      multiMDTable(),
    ],
  },
  plugins: [media(), sqliteFullTextSearch({ database: sqliteWasm() }), pdf({ prefix: 'notes', assets: 'assets:notes-raw' })],
})

// GET /api/content/pdf?path=/notes/...   (add &debug=1 to see how the raw markdown was looked up)
content.addServeHandler('pdf', async (request) => {
  const url = new URL(request.url)
  const path = url.searchParams.get('path') ?? ''
  try {
    // On a cold serverless start this route can be the first thing to touch `content`; plugin
    // methods such as content.pdf only exist once the instance is initialised.
    await content.init()
    if (typeof content.pdf !== 'function') {
      return new Response('PDF plugin is not registered: add pdf({ ... }) to the plugins list in content.ts', {
        status: 500,
      })
    }
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
