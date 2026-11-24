<script setup lang="ts">
import { computed, ref } from 'vue'
import { createReusableTemplate } from '@vueuse/core'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import type { ExamMode, ExamPaletteItem, PaletteItemState, ReviewFilter } from '~/types/quiz.types'

type LocalFilter = 'all' | 'unanswered' | 'answered' | 'marked'

const props = withDefaults(
  defineProps<{
    items: ExamPaletteItem[]
    mode: ExamMode
    submitted: boolean
    answeredCount: number
    totalCount: number
    flaggedCount: number
    // exam (PMT-EMS) sidebar only
    candidateName?: string
    candidateMssv?: string
    currentFlagged?: boolean
    reviewFilter?: ReviewFilter
    wrongCount?: number
    conflictCount?: number
  }>(),
  {
    candidateName: '',
    candidateMssv: '',
    currentFlagged: false,
    reviewFilter: 'all',
    wrongCount: 0,
    conflictCount: 0,
  },
)

const emit = defineEmits<{
  select: [id: string]
  submit: []
  'toggle-flag': []
  'update:reviewFilter': [value: ReviewFilter]
}>()

const isExam = computed(() => props.mode === 'exam')

/* ───────────── Practice (dark) ───────────── */
const mobileOpen = ref(false)
const [DefinePalette, ReusePalette] = createReusableTemplate()

const stateClass: Record<PaletteItemState, string> = {
  unanswered: 'border-white/10 bg-white/[0.03] text-white/60',
  answered: 'border-sky-400/60 bg-sky-500/20 text-sky-100',
  correct: 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100',
  incorrect: 'border-red-400/60 bg-red-500/20 text-red-100',
}

function pick(id: string) {
  emit('select', id)
  mobileOpen.value = false
}

const showResultLegend = () => props.submitted || props.mode === 'practice'

/* ───────────── Exam (PMT-EMS) ───────────── */
const localFilter = ref<LocalFilter>('all')

const filterValue = computed<string>({
  get: () => (props.submitted ? props.reviewFilter : localFilter.value),
  set: (v) => {
    if (props.submitted) emit('update:reviewFilter', v as ReviewFilter)
    else localFilter.value = v as LocalFilter
  },
})

const examItems = computed(() => {
  if (props.submitted) return props.items // already filtered by the session's review filter
  switch (localFilter.value) {
    case 'unanswered':
      return props.items.filter((i) => i.state === 'unanswered')
    case 'answered':
      return props.items.filter((i) => i.state !== 'unanswered')
    case 'marked':
      return props.items.filter((i) => i.flagged)
    default:
      return props.items
  }
})

function examRowClass(item: ExamPaletteItem): string {
  if (item.current) return 'row-current'
  if (item.state === 'correct' || item.state === 'answered') return 'row-ok'
  if (item.state === 'incorrect') return 'row-bad'
  return ''
}

function examRowTag(item: ExamPaletteItem): string {
  if (!props.submitted) return item.state === 'answered' ? '(Đã chọn)' : ''
  if (item.state === 'correct') return '(Đúng)'
  if (item.state === 'incorrect') return '(Sai)'
  return '(Bỏ trống)'
}
</script>

<template>
  <!-- ═════════════ mode=exam: PMT-EMS right sidebar ═════════════ -->
  <aside v-if="isExam" class="exam-side">
    <!-- 1. Thông tin thí sinh -->
    <section>
      <div class="side-title">Thông tin thí sinh</div>
      <div class="flex gap-2 px-2 py-1.5">
        <div class="photo" aria-hidden="true">
          <span class="i-solar-user-bold text-[34px] text-[#9a9a9a]" />
        </div>
        <dl class="min-w-0 flex-1 space-y-0.5 text-[#111]">
          <div>
            <dt class="lbl">Họ tên:</dt>
            <dd class="val break-words">{{ candidateName }}</dd>
          </div>
          <div>
            <dt class="lbl">MSSV / Lớp:</dt>
            <dd class="val tabnum">{{ candidateMssv }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- 2. Chức năng -->
    <section>
      <div class="side-title">Chức năng</div>
      <div class="space-y-2 px-2 py-2">
        <label
          class="flex cursor-pointer items-center gap-1.5 text-[#111]"
          :class="submitted ? 'opacity-50' : ''"
        >
          <input
            type="checkbox"
            class="accent-[#C00000]"
            :checked="currentFlagged"
            :disabled="submitted"
            @change="emit('toggle-flag')"
          />
          Đánh dấu xem lại câu này
        </label>
        <button
          type="button"
          class="btn-classic w-full font-bold"
          :disabled="submitted"
          @click="emit('submit')"
        >
          Nộp bài
        </button>
      </div>
    </section>

    <!-- 3. Danh sách câu hỏi -->
    <section class="flex min-h-0 flex-1 flex-col">
      <div class="side-title">Danh sách câu hỏi</div>
      <div class="flex items-center gap-1.5 px-2 pt-1.5 text-[#111]">
        <label for="exam-filter">Lọc:</label>
        <select
          id="exam-filter"
          v-model="filterValue"
          class="min-w-0 flex-1 rounded-none border border-[#8E8E8E] bg-white px-1 py-0.5 text-[12px]"
        >
          <template v-if="!submitted">
            <option value="all">Tất cả</option>
            <option value="unanswered">Chưa trả lời</option>
            <option value="answered">Đã trả lời</option>
            <option value="marked">Đánh dấu ({{ flaggedCount }})</option>
          </template>
          <template v-else>
            <option value="all">Tất cả ({{ totalCount }})</option>
            <option value="wrong">Câu sai ({{ wrongCount }})</option>
            <option value="conflict">Câu Conflict ({{ conflictCount }})</option>
          </template>
        </select>
      </div>

      <ul
        class="m-1.5 min-h-[7rem] flex-1 space-y-1 overflow-y-auto border border-[#B8A672] bg-white p-1.5"
      >
        <li v-for="item in examItems" :key="item.id">
          <button
            type="button"
            class="row"
            :class="examRowClass(item)"
            :aria-current="item.current ? 'true' : undefined"
            @click="emit('select', item.id)"
          >
            <span class="tabnum">Câu {{ item.no }}</span>
            <span class="flex items-center gap-1">
              <span
                v-if="examRowTag(item)"
                class="tag"
                :class="item.state === 'incorrect' ? 'tag-bad' : ''"
                >{{ examRowTag(item) }}</span
              >
              <span
                v-if="item.flagged"
                class="inline-block h-2 w-2 rounded-full bg-[#C00000]"
                title="Đánh dấu xem lại"
              />
            </span>
          </button>
        </li>
        <li
          v-if="examItems.length === 0"
          class="cursor-default px-1.5 py-1 text-[12px] text-[#666]"
        >
          Không có câu nào.
        </li>
      </ul>
    </section>
  </aside>

  <!-- ═════════════ mode=practice: Isolde dark palette ═════════════ -->
  <template v-else>
    <DefinePalette>
      <div class="flex h-full flex-col gap-4">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="text-sm font-semibold">Danh sách câu hỏi</h2>
          <p class="font-mono text-sm tabular-nums text-white/70">
            {{ answeredCount }}/{{ totalCount }}
          </p>
        </div>

        <div
          class="grid max-h-[48dvh] grid-cols-5 gap-2 overflow-y-auto pr-1 lg:max-h-[52dvh]"
          role="list"
          aria-label="Danh sách câu hỏi"
        >
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            role="listitem"
            class="relative grid h-11 min-w-[2.5rem] place-items-center rounded-xl border font-mono text-sm font-medium tabular-nums transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/60"
            :class="[
              stateClass[item.state],
              item.current ? 'ring-2 ring-white' : 'hover:bg-white/10',
            ]"
            :aria-current="item.current ? 'true' : undefined"
            :aria-label="`Câu ${item.no}${item.flagged ? ', đã cắm cờ' : ''}`"
            @click="pick(item.id)"
          >
            {{ item.no }}
            <span
              v-if="item.flagged"
              class="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400"
              aria-hidden="true"
            />
          </button>
        </div>

        <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-white/60">
          <li class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded border border-white/20 bg-white/[0.05]" />Chưa làm
          </li>
          <li v-if="!showResultLegend()" class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded border border-sky-400/60 bg-sky-500/30" />Đã làm
          </li>
          <template v-else>
            <li class="flex items-center gap-1.5">
              <span class="h-3 w-3 rounded border border-emerald-400/60 bg-emerald-500/30" />Đúng
            </li>
            <li class="flex items-center gap-1.5">
              <span class="h-3 w-3 rounded border border-red-400/60 bg-red-500/30" />Sai
            </li>
          </template>
          <li class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-amber-400" />Cắm cờ ({{ flaggedCount }})
          </li>
        </ul>

        <button
          v-if="!submitted"
          type="button"
          class="h-12 w-full rounded-2xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          @click="emit('submit')"
        >
          Nộp bài
        </button>
        <p v-else class="rounded-2xl bg-white/[0.06] py-3 text-center text-sm text-white/70">
          Đã nộp bài
        </p>
      </div>
    </DefinePalette>

    <aside
      class="sticky top-20 hidden self-start rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md lg:block"
    >
      <ReusePalette />
    </aside>

    <DialogRoot v-model:open="mobileOpen">
      <button
        type="button"
        class="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-1/2 -translate-x-1/2 z-30 inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-[#0A0A0A]/90 px-5 text-sm font-medium text-white shadow-lg backdrop-blur-md transition active:scale-95 focus-visible:outline-2 focus-visible:outline-white/60 lg:hidden cursor-pointer"
        @click="mobileOpen = true"
      >
        <span class="i-solar-widget-5-linear text-base" aria-hidden="true" />
        <span class="font-mono tabular-nums">{{ answeredCount }}/{{ totalCount }}</span>
      </button>

      <DialogPortal>
        <DialogOverlay
          class="palette-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
        />
        <DialogContent
          class="palette-content fixed inset-y-0 left-0 z-50 w-[min(22rem,88vw)] overflow-y-auto border-r border-white/10 bg-[#0A0A0A] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-sans text-white/90 lg:hidden"
        >
          <div class="mb-3 flex items-center justify-between">
            <DialogTitle class="text-base font-semibold">Câu hỏi</DialogTitle>
            <DialogClose
              class="grid h-10 w-10 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/60"
              aria-label="Đóng danh sách câu hỏi"
            >
              <span class="i-solar-close-circle-linear text-xl" aria-hidden="true" />
            </DialogClose>
          </div>
          <DialogDescription class="sr-only"
            >Chọn một số để chuyển đến câu hỏi tương ứng.</DialogDescription
          >
          <ReusePalette />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </template>
</template>

<style scoped>
/* ── practice drawer animation ── */
.palette-overlay[data-state='open'] {
  animation: pal-fade-in 160ms ease-out;
}
.palette-overlay[data-state='closed'] {
  animation: pal-fade-out 140ms ease-in;
}
.palette-content[data-state='open'] {
  animation: pal-slide-in 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
.palette-content[data-state='closed'] {
  animation: pal-slide-out 160ms ease-in;
}
@keyframes pal-fade-in {
  from {
    opacity: 0;
  }
}
@keyframes pal-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes pal-slide-in {
  from {
    transform: translateX(-100%);
  }
}
@keyframes pal-slide-out {
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .palette-overlay,
  .palette-content {
    animation: none !important;
  }
}

/* ── exam (PMT-EMS) sidebar ── */
.exam-side {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 42dvh;
  overflow-y: auto;
  flex-shrink: 0;
  background: #eae0b9;
  border-top: 1px solid #c5b686;
  font-family: Arial, sans-serif;
  font-size: 12px;
}
@media (min-width: 768px) {
  .exam-side {
    width: 220px;
    max-height: none;
    overflow: hidden;
    border-top: 0;
    border-left: 1px solid #c5b686;
  }
}
.tabnum {
  font-variant-numeric: tabular-nums;
}
.side-title {
  background: #d5c185;
  padding: 4px 8px;
  font-weight: 700;
  color: #222;
  border-top: 1px solid #b8a672;
  border-bottom: 1px solid #b8a672;
}
.photo {
  display: grid;
  place-items: center;
  width: 52px;
  height: 64px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #b8a672;
}
.lbl {
  color: #444;
}
.val {
  font-weight: 700;
}
.row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  min-height: 24px;
  text-align: left;
  font-size: 12px;
  color: #0033cc;
  text-decoration: underline;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.row .tag {
  font-size: 11px;
  color: #1e6b35;
  text-decoration: none;
}
.row .tag-bad {
  color: #c00000;
}
.row.row-ok {
  background: #e6f4ea;
}
.row.row-bad {
  background: #fadbd8;
}
.row.row-current {
  background: #fff3cd;
  font-weight: 700;
}
.row:hover {
  filter: brightness(0.97);
}
.row:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -2px;
}

.btn-classic {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #111;
  padding: 5px 14px;
  border: 1px solid #8e8e8e;
  border-radius: 0;
  background: linear-gradient(180deg, #f5f5f5 0%, #dcdcdc 100%);
  cursor: pointer;
}
.btn-classic:hover:not(:disabled) {
  background: linear-gradient(180deg, #ffffff 0%, #e6e6e6 100%);
  border-color: #5e5e5e;
}
.btn-classic:active:not(:disabled) {
  background: linear-gradient(180deg, #dcdcdc 0%, #f5f5f5 100%);
}
.btn-classic:disabled {
  color: #9a9a9a;
  cursor: default;
}
.btn-classic:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -4px;
}
</style>
