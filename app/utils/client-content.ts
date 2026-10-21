import { createContentClient } from 'comark-content/client'
import sqliteFullTextSearchClient from 'comark-content/plugins/sqlite-full-text-search/client'

export const clientContent = createContentClient({
  fetch: $fetch,
  plugins: [sqliteFullTextSearchClient()],
})