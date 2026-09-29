import { comarkContent } from 'comark-content'
import fs from 'comark-content/sources/fs'
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
})
