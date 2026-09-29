<script setup lang="ts">
import { clientContent } from '~/utils/client-content'

const { data: pages } = await useAsyncData('notes-list', () => clientContent.list())
</script>

<template>
  <ul>
    <li v-for="page in pages" :key="page.path">
      <NuxtLink :to="page.path">
        {{ page.path.replace(/^\/notes\//, '') }}
      </NuxtLink>
    </li>
  </ul>
</template>

<!-- Each item from content.list() has a path field (e.g. /notes/math/a), matching what content.get() returns per Frontmatter and page data. Here's a page that lists every document and links to it, with the caption as the path without the /notes/ prefix:

app/pages/notes.vue

<script setup lang="ts">
import { clientContent } from '~/utils/client-content'

const { data: pages } = await useAsyncData('notes-list', () => clientContent.list())
</script>

<template>
  <ul>
    <li v-for="page in pages" :key="page.path">
      <NuxtLink :to="page.path">
        {{ page.path.replace(/^\/notes\//, '') }}
      </NuxtLink>
    </li>
  </ul>
</template>
This gives you, for content/math/a.md (mounted at /notes prefix):


<a href="/notes/math/a">math/a</a>
Notes:

content.list() returns every document the source has — if you have non-Markdown media files mixed in (Files and paths), you may want to filter by page.meta.kind === 'document' or page.meta.extension === '.md':

<script setup lang="ts">
import { clientContent } from '~/utils/client-content'

const { data: pages } = await useAsyncData('notes-list', () => clientContent.list())
const docs = computed(() => (pages.value ?? []).filter(p => p.meta.kind === 'document'))
</script>

<template>
  <ul>
    <li v-for="page in docs" :key="page.path">
      <NuxtLink :to="page.path">
        {{ page.path.replace(/^\/notes\//, '') }}
      </NuxtLink>
    </li>
  </ul>
</template>
Since your catch-all is at app/pages/notes/[...slug].vue, this new app/pages/notes.vue will conflict/coexist depending on Nuxt's routing — Nuxt treats notes.vue and notes/[...slug].vue as separate routes (/notes exact vs /notes/*), so this should work fine as long as you don't already have content mapped to exactly /notes that you expect the catch-all to serve (your content/index.md currently maps there, per your earlier /api/debug output — that page would now be shadowed by this new listing page instead).
If you want to keep your Markdown index page at /notes AND have a listing, put the listing at a different path (e.g. /notes-index or /all-notes), since only one page component can match /notes. -->
