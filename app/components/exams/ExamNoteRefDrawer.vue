<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { Markdown } from '@comark/vue'

const props = defineProps<{
  /** Slug / path of the lesson note (ExamQuestion.note_ref). The drawer is open while this is non-null. */
  noteRef: string | null
  /**
   * Resolves a note_ref to its Markdown source.
   * Default: GET /api/notes/<note_ref> returning raw Markdown text.
   * Replace it with whatever your notes site uses to read a note by slug.
   */
  loader?: (noteRef: string) => Promise<string>
}>()

const emit = defineEmits<{ close: [] }>()

const cache = new Map<string, string>()
const markdown = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const open = computed(() => !!props.noteRef)
const fullPageHref = computed(() => (props.noteRef ? `/notes/${props.noteRef.replace(/^\/+/, '').replace(/\.md$/, '')}` : '#'))
const title = computed(() => {
  const last = props.noteRef?.split('/').filter(Boolean).pop() ?? ''
  return decodeURIComponent(last).replace(/\.md$/, '').replace(/^\d+\.\s*/, '').replace(/-/g, ' ') || 'Bài giảng'
})

async function defaultLoader(ref: string): Promise<string> {
  const path = ref.replace(/^\/+/, '').replace(/\.md$/, '').split('/').map(encodeURIComponent).join('/')
  return await $fetch<string>(`/api/notes/${path}`, { responseType: 'text' })
}

async function loadNote(ref: string) {
  const hit = cache.get(ref)
  if (hit !== undefined) {
    markdown.value = hit
    error.value = null
    return
  }
  loading.value = true
  error.value = null
  markdown.value = ''
  try {
    const text = await (props.loader ?? defaultLoader)(ref)
    if (props.noteRef !== ref) return // closed or switched while loading
    cache.set(ref, text)
    markdown.value = text
  } catch {
    if (props.noteRef === ref) error.value = 'Không tải được bài giảng này.'
  } finally {
    if (props.noteRef === ref) loading.value = false
  }
}

watch(
  () => props.noteRef,
  (ref) => {
    if (ref) loadNote(ref)
  },
  { immediate: true },
)

function onOpenChange(value: boolean) {
  if (!value) emit('close')
}
</script>

<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="note-overlay fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
      <DialogContent
        class="note-content fixed inset-y-0 right-0 z-[60] flex w-[min(40rem,100vw)] flex-col border-l border-white/10 bg-[#0A0A0A] font-sans text-white/90 shadow-2xl"
      >
        <header
          class="flex items-center gap-3 border-b border-white/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md"
        >
          <div class="min-w-0 flex-1">
            <DialogTitle class="truncate text-base font-semibold capitalize">{{ title }}</DialogTitle>
            <DialogDescription class="truncate text-xs text-white/50">Bài giảng gốc · mở ngay trong phòng thi</DialogDescription>
          </div>
          <a
            :href="fullPageHref"
            target="_blank"
            rel="noopener"
            class="hidden h-10 items-center rounded-full border border-white/10 px-3.5 text-sm text-white/75 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60 sm:inline-flex"
          >
            Mở trang đầy đủ
          </a>
          <DialogClose
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/60"
            aria-label="Đóng bài giảng"
          >
            <span class="i-solar-close-circle-linear text-xl" aria-hidden="true" />
          </DialogClose>
        </header>

        <div class="flex-1 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          <p v-if="loading" class="text-sm text-white/50">Đang tải bài giảng…</p>
          <div v-else-if="error" class="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {{ error }}
            <button v-if="noteRef" type="button" class="ml-2 underline underline-offset-2" @click="loadNote(noteRef)">Thử lại</button>
          </div>
          <Markdown v-else-if="markdown" :value="markdown" class="note-prose" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.note-overlay[data-state='open'] {
  animation: note-fade-in 160ms ease-out;
}
.note-overlay[data-state='closed'] {
  animation: note-fade-out 140ms ease-in;
}
.note-content[data-state='open'] {
  animation: note-slide-in 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.note-content[data-state='closed'] {
  animation: note-slide-out 180ms ease-in;
}
@keyframes note-fade-in {
  from { opacity: 0; }
}
@keyframes note-fade-out {
  to { opacity: 0; }
}
@keyframes note-slide-in {
  from { transform: translateX(100%); }
}
@keyframes note-slide-out {
  to { transform: translateX(100%); }
}
@media (prefers-reduced-motion: reduce) {
  .note-overlay,
  .note-content {
    animation: none !important;
  }
}

.note-prose {
  font-size: 15px;
  line-height: 1.75;
  color: rgb(255 255 255 / 0.85);
  max-width: 68ch;
  overflow-wrap: anywhere;
}
.note-prose :deep(h1) {
  font-size: 1.5rem;
  font-weight: 650;
  margin: 0 0 1rem;
  line-height: 1.3;
}
.note-prose :deep(h2) {
  font-size: 1.2rem;
  font-weight: 620;
  margin: 1.75rem 0 0.6rem;
  line-height: 1.35;
}
.note-prose :deep(h3),
.note-prose :deep(h4) {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 1.4rem 0 0.5rem;
}
.note-prose :deep(p) {
  margin: 0.7rem 0;
}
.note-prose :deep(ul),
.note-prose :deep(ol) {
  margin: 0.7rem 0;
  padding-left: 1.4rem;
}
.note-prose :deep(ul) {
  list-style: disc;
}
.note-prose :deep(ol) {
  list-style: decimal;
}
.note-prose :deep(li) {
  margin: 0.25rem 0;
}
.note-prose :deep(strong) {
  color: #fff;
  font-weight: 600;
}
.note-prose :deep(a) {
  color: #7dd3fc;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.note-prose :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.25rem 1rem;
  border-left: 3px solid rgb(255 255 255 / 0.25);
  color: rgb(255 255 255 / 0.7);
}
.note-prose :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875em;
  background: rgb(255 255 255 / 0.08);
  padding: 0.1em 0.35em;
  border-radius: 0.375rem;
}
.note-prose :deep(pre) {
  overflow-x: auto;
  margin: 1rem 0;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.05);
}
.note-prose :deep(pre code) {
  background: none;
  padding: 0;
}
.note-prose :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  margin: 1rem 0;
}
.note-prose :deep(table) {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
}
.note-prose :deep(th),
.note-prose :deep(td) {
  border: 1px solid rgb(255 255 255 / 0.12);
  padding: 0.45rem 0.7rem;
  text-align: left;
  vertical-align: top;
}
.note-prose :deep(th) {
  background: rgb(255 255 255 / 0.06);
  font-weight: 600;
}
.note-prose :deep(hr) {
  border: 0;
  border-top: 1px solid rgb(255 255 255 / 0.12);
  margin: 1.5rem 0;
}
</style>
