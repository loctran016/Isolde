<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  RadioGroupItem,
  RadioGroupRoot,
  SwitchRoot,
  SwitchThumb,
} from 'reka-ui'
import type {
  ExamFilterQuery,
  ExamHistoryRecord,
  ExamMode,
  ExamsManifest,
} from '~/types/quiz.types'
import { findLastExamRecord } from '~/composables/useExamSession'

const SECONDS_PER_QUESTION = 40
const GROUPS: { value: string; label: string }[] = [
  { value: '1', label: 'Giải phẫu' },
  { value: '2', label: 'Giải phẫu bệnh' },
  { value: '3', label: 'Mô phôi' },
  { value: '4', label: 'Sinh lý' },
  { value: '5', label: 'Sinh lý bệnh' },
  { value: '6', label: 'Dược lý' },
  { value: '7', label: 'Lâm sàng (Câu dài)' },
  { value: '8', label: 'Hình ảnh' },
]

const open = defineModel<boolean>('open', { default: false })
const manifest = ref<ExamsManifest | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)

// Section 1 – candidate
const name = ref('Trần Tấn Lộc')
const mssv = ref('Y2024')

// Section 2 – subject / exam / filters
const subject = ref('')
const exam = ref('all')
const group = ref('all')
const minutesOverride = ref<number | null>(null)

// Section 3 – mode & switches
const mode = ref<ExamMode>('practice')
const shuffle = ref(false)
const conflictOnly = ref(false)

const lastRecord = ref<ExamHistoryRecord | null>(null)

async function loadManifest() {
  if (manifest.value || loading.value) return
  loading.value = true
  loadError.value = null
  try {
    const data = await $fetch<ExamsManifest>('/data/exams/exams-manifest.json')
    manifest.value = data
    if (!subject.value && data.subjects.length) subject.value = data.subjects[0]!.subject
  } catch {
    loadError.value =
      'Không tải được danh sách đề thi. Kiểm tra public/data/exams/exams-manifest.json.'
  } finally {
    loading.value = false
  }
}

// Lazy load: nothing is fetched until the dialog is opened for the first time.
watch(open, (isOpen) => {
  if (isOpen) {
    loadManifest()
    refreshLastRecord()
  }
})

const subjectManifest = computed(
  () => manifest.value?.subjects.find((s) => s.subject === subject.value) ?? null,
)
const examOptions = computed(() => subjectManifest.value?.exams ?? [])
const selectedExam = computed(() =>
  exam.value === 'all' ? null : (examOptions.value.find((e) => e.exam_id === exam.value) ?? null),
)

watch(subject, () => {
  exam.value = 'all'
  group.value = 'all'
})
watch([subject, exam, group, conflictOnly], () => {
  minutesOverride.value = null
  refreshLastRecord()
})

function refreshLastRecord() {
  lastRecord.value = subject.value
    ? findLastExamRecord(subject.value, exam.value, group.value, conflictOnly.value ? '1' : '0')
    : null
}

const baseCountAll = computed(() => examOptions.value.reduce((sum, e) => sum + e.question_count, 0))
const scopedExams = computed(() => (selectedExam.value ? [selectedExam.value] : examOptions.value))

const baseCount = computed(() => scopedExams.value.reduce((sum, e) => sum + e.question_count, 0))
const groupCount = computed(() =>
  group.value === 'all'
    ? baseCount.value
    : scopedExams.value.reduce((sum, e) => sum + (e.group_counts[group.value] ?? 0), 0),
)
const conflictTotal = computed(() =>
  scopedExams.value.reduce((sum, e) => sum + e.conflict_count, 0),
)

// Manifest only has per-exam conflict totals, so "conflict + group" is an upper bound.
const filteredQuestionCount = computed(() => {
  if (!conflictOnly.value) return groupCount.value
  return group.value === 'all'
    ? conflictTotal.value
    : Math.min(conflictTotal.value, groupCount.value)
})
const countIsApprox = computed(() => conflictOnly.value && group.value !== 'all')

const autoMinutes = computed(() => {
  const untouched = group.value === 'all' && !conflictOnly.value
  if (untouched && selectedExam.value)
    return Math.max(1, Math.round(selectedExam.value.default_time_sec / 60))
  return Math.max(1, Math.ceil((filteredQuestionCount.value * SECONDS_PER_QUESTION) / 60))
})
const minutes = computed({
  get: () => minutesOverride.value ?? autoMinutes.value,
  set: (v: number) => {
    minutesOverride.value = Number.isFinite(v) && v > 0 ? Math.min(Math.round(v), 600) : null
  },
})

const canStart = computed(
  () => !!subject.value && filteredQuestionCount.value > 0 && name.value.trim().length > 0,
)

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  return `${m}:${String(sec % 60).padStart(2, '0')}`
}

function startSession() {
  if (!canStart.value) return
  const query: ExamFilterQuery = {
    mode: mode.value,
    exam: exam.value,
    group: group.value,
    conflict: conflictOnly.value ? '1' : '0',
    shuffle: shuffle.value ? '1' : '0',
    time: String(minutes.value),
    name: name.value.trim(),
    mssv: mssv.value.trim(),
  }
  open.value = false
  navigateTo({ path: `/exams/${subject.value}`, query: { ...query } })
}

// focus: violet thay cho trắng
const field =
  'h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white/90 outline-none transition focus:border-violet-400/70 focus:bg-white/[0.07] disabled:opacity-40'
const label = 'mb-1.5 block text-xs font-medium text-white/50'
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="exam-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <DialogContent
        class="exam-content fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[min(42rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0A0A0A] p-4 font-sans text-white/90 shadow-2xl sm:p-6"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <DialogTitle class="text-lg font-semibold tracking-tight">Vào phòng thi</DialogTitle>
            <DialogDescription class="mt-0.5 text-sm text-white/50">
              Chọn học phần, bộ đề và chế độ làm bài.
            </DialogDescription>
          </div>
          <DialogClose
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400"
            aria-label="Đóng"
          >
            <span class="i-solar-close-circle-linear text-xl" aria-hidden="true" />
          </DialogClose>
        </div>

        <p
          v-if="loading"
          class="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/50"
        >
          Đang tải danh sách đề thi…
        </p>
        <div
          v-else-if="loadError"
          class="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          {{ loadError }}
          <button type="button" class="ml-2 underline underline-offset-2" @click="loadManifest">
            Thử lại
          </button>
        </div>

        <div v-else-if="manifest" class="space-y-4">
          <!-- Section 1: candidate -->
          <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
            <header class="mb-3 flex items-center justify-between gap-3">
              <div>
                <p class="text-base font-semibold tracking-tight">PMT EMS</p>
                <p class="text-xs text-white/50">Hệ thống thi trực tuyến · Thông tin thí sinh</p>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Sẵn sàng dự thi
              </span>
            </header>
            <div class="grid gap-3 sm:grid-cols-[1fr_9rem]">
              <div>
                <label for="exam-name" :class="label">Họ và tên</label>
                <input
                  id="exam-name"
                  v-model="name"
                  :class="field"
                  type="text"
                  autocomplete="name"
                />
              </div>
              <div>
                <label for="exam-mssv" :class="label">MSSV / Lớp</label>
                <input
                  id="exam-mssv"
                  v-model="mssv"
                  :class="[field, 'font-mono tabular-nums']"
                  type="text"
                />
              </div>
            </div>
          </section>

          <!-- Section 2: subject, exam, filters -->
          <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="exam-subject" :class="label">Học phần</label>
                <select id="exam-subject" v-model="subject" :class="field">
                  <option
                    v-for="s in manifest.subjects"
                    :key="s.subject"
                    :value="s.subject"
                    class="bg-neutral-900"
                  >
                    {{ s.subject_label }}
                  </option>
                </select>
              </div>
              <div>
                <label for="exam-id" :class="label">Bộ đề</label>
                <select id="exam-id" v-model="exam" :class="field" :disabled="!subjectManifest">
                  <option value="all" class="bg-neutral-900">
                    Tất cả bộ đề ({{ baseCountAll }} câu)
                  </option>
                  <option
                    v-for="e in examOptions"
                    :key="e.exam_id"
                    :value="e.exam_id"
                    class="bg-neutral-900"
                  >
                    {{ e.title }} ({{ e.question_count }} câu)
                  </option>
                </select>
              </div>
              <div>
                <label for="exam-group" :class="label">Phân nhóm kiến thức</label>
                <select id="exam-group" v-model="group" :class="field" :disabled="!subjectManifest">
                  <option value="all" class="bg-neutral-900">Tất cả nhóm</option>
                  <option
                    v-for="g in GROUPS"
                    :key="g.value"
                    :value="g.value"
                    class="bg-neutral-900"
                  >
                    {{ g.value }}. {{ g.label }}
                  </option>
                </select>
              </div>
              <div>
                <label for="exam-minutes" :class="label">Thời gian (phút)</label>
                <input
                  id="exam-minutes"
                  v-model.number="minutes"
                  :class="[field, 'font-mono tabular-nums']"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="600"
                />
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span class="rounded-full bg-white/[0.06] px-3 py-1.5">
                <span class="font-mono tabular-nums font-semibold"
                  >{{ countIsApprox ? '≤ ' : '' }}{{ filteredQuestionCount }}</span
                >
                câu thỏa bộ lọc
              </span>
              <span
                v-if="lastRecord"
                class="rounded-full bg-violet-500/15 px-3 py-1.5 text-violet-200"
                :title="new Date(lastRecord.finishedAt).toLocaleString('vi-VN')"
              >
                Lần gần nhất:
                <span class="font-mono tabular-nums font-semibold"
                  >{{ lastRecord.percentage }}%</span
                >
                <span class="font-mono tabular-nums text-violet-200/70">
                  ({{ lastRecord.correctCount }}/{{ lastRecord.totalCount }} ·
                  {{ formatDuration(lastRecord.elapsedSec) }})
                </span>
              </span>
            </div>
            <p
              v-if="subjectManifest && filteredQuestionCount === 0"
              class="mt-2 text-xs text-amber-300"
            >
              Không có câu hỏi nào khớp bộ lọc này. Hãy đổi nhóm kiến thức hoặc tắt "Chỉ ôn câu
              Conflict".
            </p>
          </section>

          <!-- Section 3: mode & switches -->
          <section class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
            <RadioGroupRoot
              v-model="mode"
              class="grid gap-3 sm:grid-cols-2"
              aria-label="Chế độ làm bài"
            >
              <RadioGroupItem
                value="practice"
                class="min-h-[4.5rem] rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition focus-visible:outline-2 focus-visible:outline-violet-400 data-[state=checked]:border-violet-400/60 data-[state=checked]:bg-violet-500/10"
              >
                <span class="block text-sm font-semibold">Luyện tập</span>
                <span class="mt-0.5 block text-xs text-white/55"
                  >Khóa đáp án ngay khi chọn, xem giải thích và gợi ý từng câu.</span
                >
              </RadioGroupItem>
              <RadioGroupItem
                value="exam"
                class="min-h-[4.5rem] rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition focus-visible:outline-2 focus-visible:outline-violet-400 data-[state=checked]:border-amber-400/60 data-[state=checked]:bg-amber-500/10"
              >
                <span class="block text-sm font-semibold">Thi thật (PMT EMS)</span>
                <span class="mt-0.5 block text-xs text-white/55"
                  >Đếm ngược, đổi đáp án tự do, chỉ xem kết quả sau khi nộp bài.</span
                >
              </RadioGroupItem>
            </RadioGroupRoot>

            <p
              v-if="mode === 'exam'"
              class="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-relaxed text-neutral-700"
            >
              Thi thật dùng giao diện mô phỏng PMT-EMS (nền sáng): đếm ngược, không có gợi ý, chỉ
              xem đáp án và giải thích sau khi nộp bài.
            </p>

            <div class="mt-4 space-y-1">
              <label
                class="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl px-1"
              >
                <span class="text-sm">Đảo thứ tự câu &amp; đáp án</span>
                <SwitchRoot
                  v-model="shuffle"
                  class="relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition data-[state=checked]:bg-violet-500 focus-visible:outline-2 focus-visible:outline-violet-300"
                >
                  <SwitchThumb
                    class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[1.375rem]"
                  />
                </SwitchRoot>
              </label>
              <label
                class="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl px-1"
              >
                <span class="text-sm">Chỉ ôn câu Conflict</span>
                <SwitchRoot
                  v-model="conflictOnly"
                  class="relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition data-[state=checked]:bg-amber-500 focus-visible:outline-2 focus-visible:outline-amber-300"
                >
                  <SwitchThumb
                    class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[1.375rem]"
                  />
                </SwitchRoot>
              </label>
            </div>
          </section>

          <button
            type="button"
            class="h-12 w-full rounded-2xl bg-violet-500 text-sm font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-violet-500"
            :disabled="!canStart"
            @click="startSession"
          >
            {{ mode === 'exam' ? 'Bắt đầu thi' : 'Bắt đầu luyện tập' }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.exam-overlay[data-state='open'] {
  animation: exam-fade-in 160ms ease-out;
}
.exam-overlay[data-state='closed'] {
  animation: exam-fade-out 120ms ease-in;
}
.exam-content[data-state='open'] {
  animation: exam-pop-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.exam-content[data-state='closed'] {
  animation: exam-pop-out 120ms ease-in;
}
@keyframes exam-fade-in {
  from {
    opacity: 0;
  }
}
@keyframes exam-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes exam-pop-in {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.97);
  }
}
@keyframes exam-pop-out {
  to {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.97);
  }
}
@media (prefers-reduced-motion: reduce) {
  .exam-overlay,
  .exam-content {
    animation: none !important;
  }
}
</style>
