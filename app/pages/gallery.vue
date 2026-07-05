<script setup lang="ts">
import type { CloudinaryPhoto } from '~/server/api/gallery.get'

// useHead({ title: 'Gallery' })

// app/pages/musical.vue
definePageMeta({ title: 'Light Island' })

const { data: photos, status } = await useFetch<CloudinaryPhoto[]>('/api/gallery')

// folder -> tag -> photos[], both levels sorted alphabetically
const grouped = computed(() => {
  const byFolder = new Map<string, Map<string, CloudinaryPhoto[]>>()

  for (const photo of photos.value ?? []) {
    const folderKey = photo.folder
    if (!byFolder.has(folderKey)) byFolder.set(folderKey, new Map())
    const byTag = byFolder.get(folderKey)!

    // A photo with multiple tags appears once per tag section.
    // If you'd rather each photo show up only once, swap this
    // for: const tagKeys = [photo.tags[0] ?? 'Untagged']
    const tagKeys = photo.tags.length ? photo.tags : ['Untagged']
    for (const tag of tagKeys) {
      if (!byTag.has(tag)) byTag.set(tag, [])
      byTag.get(tag)!.push(photo)
    }
  }

  return [...byFolder.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, tagMap]) => ({
      folder,
      tagGroups: [...tagMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tag, items]) => ({ tag, items })),
    }))
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-20 space-y-12 font-sans dark:text-gray-100">
    <h1 class="text-2xl font-semibold font-head">Gallery</h1>

    <p v-if="status === 'pending'" class="text-stone-500 dark:text-stone-400">Loading photos…</p>

    <section v-for="group in grouped" :key="group.folder" class="space-y-6">
      <h2
        class="text-xl font-medium capitalize border-b border-stone-800/10 dark:border-stone-100/10 pb-2"
      >
        {{ group.folder }}
      </h2>

      <div v-for="tagGroup in group.tagGroups" :key="tagGroup.tag" class="space-y-3">
        <h3 class="text-sm uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {{ tagGroup.tag }}
        </h3>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <CldImage
            v-for="photo in tagGroup.items"
            :key="`${tagGroup.tag}-${photo.publicId}`"
            :src="photo.publicId"
            :width="400"
            :height="400"
            crop="fill"
            gravity="auto"
            format="auto"
            quality="auto"
            loading="lazy"
            :alt="photo.publicId"
            class="rounded-lg object-cover w-full aspect-square"
          />
        </div>
      </div>
    </section>

    <p v-if="status === 'success' && !photos?.length" class="text-stone-500 dark:text-stone-400">
      No photos found in your Cloudinary library yet.
    </p>
  </div>
</template>
