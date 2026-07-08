<template>
  <div>
    <div ref="sheetMusic"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ abcNotation: string }>()

const sheetMusic = ref<HTMLElement | null>(null)
let abcjs: typeof import('abcjs') | null = null
let abcjsLoadPromise: Promise<typeof import('abcjs')> | null = null

let isMounted = false
let renderId = 0 // guards against stale/out-of-order async renders

async function renderAbc() {
  if (!sheetMusic.value || !props.abcNotation) return
  const id = ++renderId

  if (!abcjs) {
    // share one in-flight import so rapid calls don't each re-request the module
    abcjsLoadPromise ??= import('abcjs')
    abcjs = await abcjsLoadPromise
  }

  // Bail out if we unmounted, or a newer render call started, while awaiting.
  if (!isMounted || id !== renderId || !sheetMusic.value) return

  sheetMusic.value.innerHTML = ''
  abcjs.renderAbc(sheetMusic.value, props.abcNotation, {
    responsive: 'resize',
    selectionColor: 'oklch(55.8% 0.288 302.321)',
  })
}

onMounted(async () => {
  isMounted = true
  await renderAbc()
})

watch(
  () => props.abcNotation,
  async () => {
    await renderAbc()
  },
)

onBeforeUnmount(() => {
  isMounted = false
  renderId++ // invalidate any in-flight render
  if (sheetMusic.value) sheetMusic.value.innerHTML = ''
})
</script>
