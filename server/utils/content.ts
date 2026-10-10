import { comarkContent } from 'comark-content'
import { defineComarkPlugin } from 'comark/parse'
import media from 'comark-content/plugins/media'
import fs from 'comark-content/sources/fs'
import mermaid from 'comark/plugins/mermaid'
import toc from 'comark/plugins/toc'
import { withSnapshot } from 'comark-content/sources/snapshot'
import markdownItMultiMDTable from 'markdown-it-multimd-table'
import markdownItSup from 'markdown-it-sup'

const multiMDTable = defineComarkPlugin(() => ({
  name: 'multiMDTable',
  markdownItPlugins: [markdownItMultiMDTable],
}))

const subscript = defineComarkPlugin(() => ({
  name: "subscript",
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
        useStorage('assets:comark').get('default/snapshot.json'),
      ),
    () =>
      import('nitropack/runtime').then(({ useStorage }) =>
        useStorage('assets:comark').get('default/manifest.json'),
      ),
    ),
     markdown: {
    plugins: [mermaid(),toc(),multiMDTable(),subscript(),superscript()],
  },
  plugins: [media()],
})

import type { Node } from "comark"

function parseSubscript(node: Node): Node[] {
  if (typeof node === "string") {
    const nodes: Node[] = []

    for (const [index, part] of Object.entries(node.split(/~([^~\n]+)~/u))) {
      if (part) {
        const isEvenIndex = Number(index) % 2 === 0
        nodes.push(isEvenIndex ? part : ["sub", {}, part])
      }
    }

    return nodes
  }

  const [tag, props, ...children] = node

  // Comment node: [null, attrs, content] — don't split its body.
  if (tag === null) return [node]

  return [[tag, props ?? {}, ...children.flatMap(parseSubscript)]]
}
