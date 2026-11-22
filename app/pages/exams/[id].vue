<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import type { ReviewFilter } from '~/types/quiz.types'
import { parseExamQuery, useExamSession } from '~/composables/useExamSession'

definePageMeta({ layout: false }) // strips Isolde's 4-icon bottom dock

// Cosmetic labels in the PMT-EMS "Thông tin lịch thi" strip. Edit freely.
const EXAM_SHIFT_LABEL = '1'
const EXAM_ROOM_LABEL = 'Phòng máy tính'

const route = useRoute()
const subject = computed(() => String(route.params.id ?? ''))
const query = computed(() => parseExamQuery(route.query))

const session = useExamSession(subject, query)
const {
  loading,
  error,
  subjectLabel,
  isExam,
  totalCount,
  visibleQuestions,
  currentQuestion,
  currentNumber,
  paletteItems,
  answers,
  flagged,
  revealedHints,
  answeredCount,
  unansweredCount,
  flaggedCount,
  wrongCount,
  conflictCount,
  remainingSec,
  isWarning,
  submitted,
  autoSubmitted,
  summary,
  reviewFilter,
  activeNoteRef,
  hasNext,
  hasPrev,
} = session

useHead(() => ({
  title: `${isExam.value ? 'Thi thật' : 'Luyện tập'} · ${subjectLabel.value || 'Phòng thi'}`,
  htmlAttrs: {
    style: isExam.value
      ? 'background:#FFFFFF;color-scheme:light'
      : 'background:#0A0A0A;color-scheme:dark',
  },
  meta: [{ name: 'theme-color', content: isExam.value ? '#C6AE68' : '#0A0A0A' }],
}))

// Date is filled on the client only, to avoid SSR/CSR hydration mismatch.
const examDate = ref('')

onMounted(() => {
  examDate.value = new Date().toLocaleDateString('vi-VN')
  session.load()
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

const inProgress = computed(() => isExam.value && !submitted.value && totalCount.value > 0)

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (inProgress.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
onBeforeRouteLeave(() => {
  if (
    inProgress.value &&
    !window.confirm(
      'Bài thi chưa nộp. Thoát phòng thi sẽ mất toàn bộ bài làm. Bạn chắc chắn thoát?',
    )
  )
    return false
})

// ── Submit flow ──
const confirmOpen = ref(false)
const showResult = ref(false) // exam: result dialog right after submitting

function requestSubmit() {
  if (!submitted.value && totalCount.value) confirmOpen.value = true
}
function confirmSubmit() {
  confirmOpen.value = false
  session.submitExam()
}
function leaveRoom() {
  navigateTo('/notes')
}
watch(submitted, (v) => {
  if (v && isExam.value) showResult.value = true
})

// ── Practice review tabs ──
const reviewTabs = computed<{ value: ReviewFilter; label: string; count: number }[]>(() => [
  { value: 'all', label: 'Tất cả', count: totalCount.value },
  { value: 'wrong', label: 'Câu sai', count: wrongCount.value },
  { value: 'conflict', label: 'Câu Conflict', count: conflictCount.value },
])

// ── Keyboard: ← / → to move, 1-6 or A-F to answer ──
function onKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const el = e.target as HTMLElement | null
  if (el) {
    const type = (el as HTMLInputElement).type
    const typing =
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) &&
      type !== 'radio' &&
      type !== 'checkbox'
    if (typing || el.isContentEditable) return
  }
  if (activeNoteRef.value || confirmOpen.value || showResult.value) return
  const q = currentQuestion.value
  if (!q) return

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    session.next()
    return
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    session.prev()
    return
  }
  if (e.key.length !== 1) return
  const k = e.key.toLowerCase()
  const idx = /^[1-6]$/.test(k) ? Number(k) - 1 : 'abcdef'.indexOf(k)
  const opt = idx >= 0 ? q.displayOptions[idx] : undefined
  if (opt) {
    e.preventDefault()
    session.selectAnswer(q.id, opt.key)
  }
}

// ── Exam (PMT-EMS) specifics ──
const questionPane = ref<HTMLElement | null>(null)

// [TẠM TẮT] Bản sửa scroll (mỗi mode tự sở hữu scroll container).
// Bật lại: bỏ comment khối này + đổi class theo các comment trong template.
// const examRoot = ref<HTMLElement | null>(null)
// const practiceRoot = ref<HTMLElement | null>(null)
// watch(
//   () => currentQuestion.value?.id,
//   async () => {
//     await nextTick()
//     questionPane.value?.scrollTo({ top: 0 })
//     examRoot.value?.scrollTo({ top: 0 })
//     practiceRoot.value?.scrollTo({ top: 0 })
//   },
// )

// Bản gốc
watch(
  () => currentQuestion.value?.id,
  async () => {
    await nextTick()
    questionPane.value?.scrollTo({ top: 0 })
  },
)

const clock = computed(() => {
  const s = Math.max(0, remainingSec.value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))} : ${pad(Math.floor((s % 3600) / 60))} : ${pad(s % 60)}`
})

const currentFlagged = computed(() =>
  currentQuestion.value ? !!flagged.value[currentQuestion.value.id] : false,
)

function toggleCurrentFlag() {
  if (currentQuestion.value && !submitted.value) session.toggleFlag(currentQuestion.value.id)
}

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60)
  return `${String(m).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

const scoreTone = computed(() => {
  const p = summary.value?.percentage ?? 0
  return p >= 80 ? 'text-emerald-300' : p >= 50 ? 'text-amber-300' : 'text-red-300'
})
</script>

<template>
  <!-- ═════════════════════════════════════════════════════════════
       mode=exam  →  PMT-EMS ExamSys replica (light, no Isolde theme)
       ═════════════════════════════════════════════════════════════ -->
  <!--
    [TẠM TẮT] Scroll fix cho exam root. Khi bật lại, thay class của div dưới bằng:
    ref="examRoot"
    class="exam-root flex h-dvh select-none flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-white md:overflow-hidden"
    và wrapper body: "flex flex-none flex-col md:min-h-0 md:flex-1 md:flex-row"
    main: "flex min-w-0 flex-col border-[#B8A672] bg-white md:min-h-0 md:flex-1 md:border-r"
    questionPane: "p-4 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:p-5"
  -->
  <div v-if="isExam" class="exam-root flex h-dvh select-none flex-col overflow-hidden bg-white">
    <header class="exam-banner flex h-11 shrink-0 items-center justify-center px-2">
      <h1
        class="sans text-center text-[13px] font-bold uppercase tracking-wide text-[#1A1A1A] sm:text-[15px]"
      >
        HỆ THỐNG TRẮC NGHIỆM TRỰC TUYẾN
      </h1>
    </header>

    <!-- Thông tin lịch thi -->
    <div
      class="sans flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[#B8A672] bg-[#EAE0B9] px-3 py-1.5"
    >
      <div class="min-w-0">
        <div
          class="mb-1 inline-block border-b border-[#C5B686] pb-0.5 pr-12 text-[12px] font-bold text-[#333]"
        >
          Thông tin lịch thi
        </div>
        <div class="text-[13px] text-[#111]">
          Môn thi: {{ subjectLabel || '…' }} - Tiết [{{ EXAM_SHIFT_LABEL }}] - Ngày:
          {{ examDate }} - Phòng: {{ EXAM_ROOM_LABEL }}
        </div>
      </div>
      <div class="text-right">
        <div v-if="!submitted">
          <span class="mr-2 text-[13px] text-[#222]">Thời gian còn lại:</span>
          <span
            class="tabnum text-[18px] font-bold"
            :class="isWarning ? 'text-[#C00000]' : 'text-[#001F8E]'"
            role="timer"
            aria-label="Thời gian còn lại"
            >{{ clock }}</span
          >
        </div>
        <div v-else class="text-[13px] font-bold text-[#111]">
          Đã nộp bài<template v-if="summary">
            — Kết quả:
            <span class="tabnum text-[#001F8E]"
              >{{ summary.correctCount }} / {{ summary.totalCount }}</span
            >
            (<span class="tabnum">{{ summary.percentage }}%</span>)</template
          >
        </div>
        <div>
          <span class="mr-2 text-[12px] text-[#333]">Số câu trả lời / Tổng số câu:</span>
          <span class="tabnum text-[13px] font-bold text-[#111]"
            >{{ answeredCount }} / {{ totalCount }}</span
          >
        </div>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <!-- Left: question pane -->
      <main class="flex min-h-0 min-w-0 flex-1 flex-col border-[#B8A672] bg-white md:border-r">
        <div ref="questionPane" class="flex-1 overflow-y-auto p-5">
          <div v-if="loading" class="sans text-[13px] text-[#555]" aria-busy="true">
            Đang tải đề thi…
          </div>

          <div v-else-if="error" class="sans max-w-md space-y-3 text-[13px] text-[#C00000]">
            <p>{{ error }}</p>
            <div class="flex gap-2">
              <button type="button" class="btn-classic" @click="session.load()">Thử lại</button>
              <button type="button" class="btn-classic" @click="leaveRoom">Thoát phòng thi</button>
            </div>
          </div>

          <div v-else-if="!totalCount" class="sans max-w-md space-y-3 text-[13px] text-[#111]">
            <p>Không có câu hỏi nào khớp bộ lọc đã chọn.</p>
            <button type="button" class="btn-classic" @click="leaveRoom">Thoát phòng thi</button>
          </div>

          <ExamQuestionCard
            v-else-if="currentQuestion"
            :key="currentQuestion.id"
            :question="currentQuestion"
            :index="currentNumber"
            :total="totalCount"
            :subject="subject"
            mode="exam"
            :selected-key="answers[currentQuestion.id] ?? null"
            :reveal="session.isRevealed(currentQuestion)"
            :flagged="currentFlagged"
            :hint-revealed="false"
            @select="session.selectAnswer(currentQuestion.id, $event)"
          />
          <p v-else class="sans text-[13px] text-[#555]">Không có câu nào trong bộ lọc này.</p>
        </div>

        <!-- Navigation bar -->
        <div
          class="sans flex shrink-0 flex-wrap items-center gap-2 border-t border-[#D0D0D0] bg-[#F7F7F7] px-5 py-2"
        >
          <button type="button" class="btn-classic" :disabled="!hasPrev" @click="session.prev()">
            &lt; Câu trước
          </button>
          <button
            type="button"
            class="btn-classic"
            :class="currentFlagged ? 'is-flagged' : ''"
            :disabled="submitted || !currentQuestion"
            :aria-pressed="currentFlagged"
            @click="toggleCurrentFlag"
          >
            {{ currentFlagged ? '✔ Đã đánh dấu xem lại' : 'Đánh dấu xem lại' }}
          </button>
          <button type="button" class="btn-classic" :disabled="!hasNext" @click="session.next()">
            Câu tiếp theo &gt;
          </button>
          <span class="ml-auto hidden text-[12px] text-[#555] lg:inline"
            >Phím tắt: ← → chuyển câu · 1-4 hoặc A-D chọn đáp án</span
          >
        </div>
      </main>

      <!-- Right: sidebar (Thông tin thí sinh / Chức năng / Danh sách câu hỏi) -->
      <ExamPaletteDrawer
        v-if="totalCount"
        :items="paletteItems"
        mode="exam"
        :submitted="submitted"
        :answered-count="answeredCount"
        :total-count="totalCount"
        :flagged-count="flaggedCount"
        :candidate-name="query.name || 'Thí sinh'"
        :candidate-mssv="query.mssv"
        :current-flagged="currentFlagged"
        :review-filter="reviewFilter"
        :wrong-count="wrongCount"
        :conflict-count="conflictCount"
        @select="session.goToId($event)"
        @submit="requestSubmit"
        @toggle-flag="toggleCurrentFlag"
        @update:review-filter="session.setReviewFilter($event)"
      />
    </div>

    <!-- Result dialog (after submit / auto-submit) -->
    <div
      v-if="showResult && summary"
      class="sans fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-result-title"
    >
      <div
        class="w-[380px] max-w-[calc(100vw-1.5rem)] border border-[#6E6E6E] bg-[#F0F0F0] shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
      >
        <div
          id="exam-result-title"
          class="exam-banner px-3 py-1.5 text-[13px] font-bold text-[#1A1A1A]"
        >
          Bài thi đã được nộp
        </div>
        <div class="space-y-1 px-4 py-3 text-[13px] text-[#111]">
          <p v-if="autoSubmitted" class="font-bold text-[#C00000]">
            Hết giờ làm bài — hệ thống đã tự động nộp bài.
          </p>
          <p>
            Số câu đúng:
            <b class="tabnum">{{ summary.correctCount }} / {{ summary.totalCount }}</b> (<span
              class="tabnum"
              >{{ summary.percentage }}%</span
            >)
          </p>
          <p>
            Số câu đã làm:
            <b class="tabnum">{{ summary.answeredCount }} / {{ summary.totalCount }}</b>
          </p>
          <p>
            Thời gian làm bài: <b class="tabnum">{{ formatElapsed(summary.elapsedSec) }}</b>
          </p>
        </div>
        <div class="flex justify-end gap-2 px-4 pb-3">
          <button type="button" class="btn-classic font-bold" @click="showResult = false">
            Xem lại bài làm
          </button>
          <button type="button" class="btn-classic" @click="leaveRoom">Thoát phòng thi</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════
       mode=practice  →  Isolde #0A0A0A dark study theme (glass + violet primary)
       ═════════════════════════════════════════════════════════════ -->
  <!--
    [TẠM TẮT] Scroll fix cho practice root. Khi bật lại, thay class của div dưới bằng:
    ref="practiceRoot"
    class="h-dvh overflow-y-auto overflow-x-hidden overscroll-contain bg-[#0A0A0A] font-sans text-white/90 antialiased"
  -->
  <div v-else class="min-h-dvh bg-[#0A0A0A] font-sans text-white/90 antialiased">
    <header
      class="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/85 pt-[env(safe-area-inset-top)] backdrop-blur-md"
    >
      <div
        class="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 sm:px-5"
      >
        <div class="min-w-0">
          <NuxtLink
            to="/notes"
            class="inline-flex h-10 items-center gap-1.5 rounded-full pr-3 text-sm text-white/75 transition hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400"
          >
            <span class="i-solar-arrow-left-linear text-base" aria-hidden="true" />
            <span class="truncate">Notes Island</span>
          </NuxtLink>
        </div>
        <div class="text-center">
          <span
            class="inline-flex whitespace-nowrap rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300 sm:text-sm"
          >
            Chế độ Luyện tập
          </span>
        </div>
        <div class="flex justify-end">
          <p class="font-mono text-sm tabular-nums text-white/70">
            {{ answeredCount }}<span class="text-white/40">/</span>{{ totalCount }}
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-3 pb-28 pt-5 sm:px-5 lg:pb-10">
      <div v-if="loading" class="space-y-4" aria-busy="true">
        <div class="h-24 animate-pulse rounded-3xl bg-white/[0.04]" />
        <div class="h-72 animate-pulse rounded-3xl bg-white/[0.04]" />
      </div>

      <div
        v-else-if="error"
        class="mx-auto max-w-md rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-center"
      >
        <p class="text-sm text-red-200">{{ error }}</p>
        <div class="mt-4 flex justify-center gap-2">
          <button
            type="button"
            class="h-11 rounded-full bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            @click="session.load()"
          >
            Thử lại
          </button>
          <button
            type="button"
            class="h-11 rounded-full border border-white/20 px-5 text-sm transition hover:bg-white/10"
            @click="leaveRoom"
          >
            Quay lại Notes
          </button>
        </div>
      </div>

      <div
        v-else-if="!totalCount"
        class="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center"
      >
        <p class="text-sm text-white/70">Không có câu hỏi nào khớp bộ lọc đã chọn.</p>
        <button
          type="button"
          class="mt-4 h-11 rounded-full bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          @click="leaveRoom"
        >
          Quay lại Notes
        </button>
      </div>

      <div v-else class="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-6">
        <div class="min-w-0 space-y-4">
          <section
            v-if="submitted && summary"
            class="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md sm:p-6"
            aria-live="polite"
          >
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="text-sm text-white/55">Kết quả · {{ subjectLabel }}</p>
                <p class="font-mono text-5xl font-semibold tabular-nums" :class="scoreTone">
                  {{ summary.percentage }}%
                </p>
              </div>
              <dl class="grid grid-cols-3 gap-5 text-sm">
                <div>
                  <dt class="text-white/50">Đúng</dt>
                  <dd class="font-mono text-lg font-semibold tabular-nums">
                    {{ summary.correctCount }}/{{ summary.totalCount }}
                  </dd>
                </div>
                <div>
                  <dt class="text-white/50">Chưa làm</dt>
                  <dd class="font-mono text-lg font-semibold tabular-nums">
                    {{ summary.totalCount - summary.answeredCount }}
                  </dd>
                </div>
                <div>
                  <dt class="text-white/50">Thời gian</dt>
                  <dd class="font-mono text-lg font-semibold tabular-nums">
                    {{ formatElapsed(summary.elapsedSec) }}
                  </dd>
                </div>
              </dl>
            </div>

            <div
              class="mt-5 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Lọc câu hỏi để xem lại"
            >
              <button
                v-for="tab in reviewTabs"
                :key="tab.value"
                type="button"
                role="tab"
                class="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition focus-visible:outline-2 focus-visible:outline-violet-400"
                :class="
                  reviewFilter === tab.value
                    ? 'border-violet-500 bg-violet-500 text-white'
                    : 'border-white/15 text-white/75 hover:bg-white/10'
                "
                :aria-selected="reviewFilter === tab.value"
                @click="session.setReviewFilter(tab.value)"
              >
                {{ tab.label }}
                <span
                  class="font-mono text-xs tabular-nums"
                  :class="reviewFilter === tab.value ? 'text-white/70' : 'text-white/50'"
                >
                  {{ tab.count }}
                </span>
              </button>
            </div>
            <p class="mt-3 text-xs text-white/45">"Câu sai" gồm cả các câu chưa trả lời.</p>
          </section>

          <ExamQuestionCard
            v-if="currentQuestion"
            :key="currentQuestion.id"
            :question="currentQuestion"
            :index="currentNumber"
            :total="totalCount"
            :subject="subject"
            mode="practice"
            :selected-key="answers[currentQuestion.id] ?? null"
            :reveal="session.isRevealed(currentQuestion)"
            :flagged="!!flagged[currentQuestion.id]"
            :hint-revealed="!!revealedHints[currentQuestion.id]"
            @select="session.selectAnswer(currentQuestion.id, $event)"
            @toggle-flag="session.toggleFlag(currentQuestion.id)"
            @toggle-hint="session.toggleHint(currentQuestion.id)"
            @open-note="session.openNoteRef($event)"
          />
          <div
            v-else
            class="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/60"
          >
            Không có câu nào trong bộ lọc này.
          </div>

          <nav
            v-if="visibleQuestions.length"
            class="flex items-center justify-between gap-3"
            aria-label="Chuyển câu hỏi"
          >
            <button
              type="button"
              class="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/15 px-5 text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-400 disabled:opacity-30"
              :disabled="!hasPrev"
              @click="session.prev()"
            >
              <span class="i-solar-alt-arrow-left-linear" aria-hidden="true" />
              Câu trước
            </button>
            <p class="hidden text-xs text-white/40 sm:block">
              ← → chuyển câu · A–D hoặc 1–4 chọn đáp án
            </p>
            <button
              type="button"
              class="inline-flex h-11 items-center gap-1.5 rounded-full bg-violet-500 px-5 text-sm font-medium text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:bg-white/10 disabled:text-white/30 disabled:hover:bg-white/10"
              :disabled="!hasNext"
              @click="session.next()"
            >
              Câu sau
              <span class="i-solar-alt-arrow-right-linear" aria-hidden="true" />
            </button>
          </nav>
        </div>

        <ExamPaletteDrawer
          :items="paletteItems"
          mode="practice"
          :submitted="submitted"
          :answered-count="answeredCount"
          :total-count="totalCount"
          :flagged-count="flaggedCount"
          @select="session.goToId($event)"
          @submit="requestSubmit"
        />
      </div>
    </main>

    <ExamNoteRefDrawer :note-ref="activeNoteRef" @close="session.closeNoteRef()" />
  </div>

  <!-- Submit confirmation (shared; styled per mode) -->
  <DialogRoot v-model:open="confirmOpen">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[70]"
        :class="isExam ? 'bg-black/40' : 'bg-black/70 backdrop-blur-sm'"
      />

      <DialogContent
        v-if="isExam"
        class="sans fixed left-1/2 top-1/2 z-[70] w-[380px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 border border-[#6E6E6E] bg-[#F0F0F0] shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
      >
        <DialogTitle class="exam-banner px-3 py-1.5 text-[13px] font-bold text-[#1A1A1A]"
          >Xác nhận nộp bài</DialogTitle
        >
        <DialogDescription as="div" class="space-y-1 px-4 py-3 text-[13px] text-[#111]">
          <p>Bạn có chắc chắn muốn nộp bài?</p>
          <p>
            Số câu đã làm: <b class="tabnum">{{ answeredCount }}</b> /
            <span class="tabnum">{{ totalCount }}</span>
          </p>
          <p :class="unansweredCount > 0 ? 'text-[#C00000]' : ''">
            Số câu chưa làm: <b class="tabnum">{{ unansweredCount }}</b>
          </p>
          <p v-if="flaggedCount > 0">
            Số câu đánh dấu xem lại: <b class="tabnum">{{ flaggedCount }}</b>
          </p>
        </DialogDescription>
        <div class="flex justify-end gap-2 px-4 pb-3">
          <button type="button" class="btn-classic font-bold" @click="confirmSubmit">
            Nộp bài
          </button>
          <button type="button" class="btn-classic" @click="confirmOpen = false">Hủy</button>
        </div>
      </DialogContent>

      <DialogContent
        v-else
        class="fixed left-1/2 top-1/2 z-[70] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 font-sans text-white/90 shadow-2xl"
      >
        <DialogTitle class="text-lg font-semibold">Nộp bài?</DialogTitle>
        <DialogDescription class="mt-2 text-sm leading-relaxed text-white/60">
          Bạn đã trả lời
          <span class="font-mono tabular-nums text-white"
            >{{ answeredCount }}/{{ totalCount }}</span
          >
          câu<template v-if="unansweredCount > 0">
            , còn
            <span class="font-mono tabular-nums text-amber-300">{{ unansweredCount }}</span> câu
            chưa làm</template
          ><template v-if="flaggedCount > 0">
            và <span class="font-mono tabular-nums text-amber-300">{{ flaggedCount }}</span> câu
            đang cắm cờ</template
          >. Sau khi nộp bạn không thể sửa đáp án.
        </DialogDescription>
        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="h-11 flex-1 rounded-full border border-white/20 text-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-400"
            @click="confirmOpen = false"
          >
            Làm tiếp
          </button>
          <button
            type="button"
            class="h-11 flex-1 rounded-full bg-violet-500 text-sm font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            @click="confirmSubmit"
          >
            Nộp bài
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.exam-root {
  font-family: 'Times New Roman', Times, serif;
}
.exam-root .sans,
.sans {
  font-family: Arial, sans-serif;
}
.tabnum {
  font-variant-numeric: tabular-nums;
}
.exam-banner {
  background: linear-gradient(180deg, #dfc98a 0%, #c6ae68 100%);
  border-bottom: 1px solid #9e8747;
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
.btn-classic.is-flagged {
  background: linear-gradient(180deg, #fff3cd 0%, #f2d98a 100%);
  border-color: #b8860b;
}
.btn-classic:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -4px;
}
</style>
