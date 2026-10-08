import { comarkContent } from 'comark-content'
import media from 'comark-content/plugins/media'
import fs from 'comark-content/sources/fs'
import mermaid from 'comark/plugins/mermaid'
import toc from 'comark/plugins/toc'
import { withSnapshot } from 'comark-content/sources/snapshot'

export const content = comarkContent({
  source: withSnapshot(
    fs('./content', { prefix: '/notes' }),
    () =>
      import('nitropack/runtime').then(({ useStorage }) =>
        useStorage('assets:comark').get('default/snapshot.json'),
      ),
    () =>
      import('nitropack/runtime').then(({ useStorage }) =>
        useStorage('assets:comark').get('default/manifest.json'),
      ),
    ),
     markdown: {
    plugins: [mermaid(),toc()],
  },
  plugins: [media()],
})

// const nfc = (s: string) => s.normalize('NFC')

// content.addServeHandler('media', async (request) => {
//   const pathname = new URL(request.url).pathname
//   const key = decodeURIComponent(pathname.slice(pathname.indexOf('/media/') + '/media/'.length))

//   await (content as any).init()
//   // The key is built from the note's folder (disk spelling) plus the link text, so try both Unicode forms.
//   const found = [key, key.normalize('NFC'), key.normalize('NFD')].find((k) =>
//     (content as any).stat(k),
//   )
//   const item = found && (content as any).stat(found)
//    if (!item || item.meta?.kind !== 'media') {
//     const count = (await (content as any).media.list()).length
//     return new Response(`Not in index (${count} media items) for key: ${key}`, { status: 404 })
//   }

//   const raw = await (content as any).media.get(found)
//   if (raw == null) return new Response('Bytes unavailable', { status: 404 })

//   return new Response(raw as BodyInit, {
//     headers: { 'content-type': item.meta.type, 'cache-control': 'public, max-age=86400' },
//   })
// })
