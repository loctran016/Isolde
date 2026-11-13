<script setup lang="ts">
// Renders a ```markmap code block as an interactive mind map with <markmap-view>.
// @markmap/element does nothing on the server, so the map is created in the browser only.
const props = defineProps<{ markdown?: string }>()

const { themePref } = useTheme()
const colorScheme = computed(() => (themePref.value === 'system' ? 'auto' : themePref.value))

const el = ref<HTMLElement | null>(null)

const setMarkdown = () => {
  if (el.value) (el.value as any).markdown = props.markdown ?? ''
}

onMounted(async () => {
  await import('@markmap/element')
  await customElements.whenDefined('markmap-view')
  setMarkdown()
})
watch(() => props.markdown, setMarkdown)
</script>

<template>
  <ClientOnly>
    <markmap-view ref="el" class="not-prose markmap-block" :color-scheme="colorScheme" toolbar />
  </ClientOnly>
</template>

<style>
.markmap-block {
  display: block;
  width: 100%;
  height: 28rem;
  margin: 1.5em 0;
  border: 1px solid rgba(100, 116, 139, 0.35);
  border-radius: 0.5rem;
}
</style>
