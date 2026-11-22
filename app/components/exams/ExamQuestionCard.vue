<script setup lang="ts">
import { computed } from 'vue'
import type { ExamMode, PreparedQuestion } from '~/types/quiz.types'

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect'

const props = defineProps<{
  question: PreparedQuestion
  index: number // 1-based position in the full session
  total: number
  subject: string
  mode: ExamMode
  selectedKey: string | null
  reveal: boolean // practice: answered; exam: submitted
  flagged: boolean
  hintRevealed: boolean
}>()

const emit = defineEmits<{
  select: [key: string]
  'toggle-flag': []
  'toggle-hint': []
  'open-note': [ref: string]
}>()

const isExam = computed(() => props.mode === 'exam')
const imageSrc = computed(() =>
  props.question.image ? `/data/exams/${props.subject}/${props.question.image}` : null,
)
const locked = computed(() => props.reveal && props.mode === 'practice')
const interactive = computed(() => !(props.mode === 'exam' && props.reveal))

function optionState(key: string): OptionState {
  if (props.reveal) {
    if (key === props.question.answer) return 'correct'
    if (key === props.selectedKey) return 'incorrect'
    return 'idle'
  }
  return key === props.selectedKey ? 'selected' : 'idle'
}

// ── Practice (dark) styles ──
const optionClass: Record<OptionState, string> = {
  idle: 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]',
  selected: 'border-sky-400/70 bg-sky-500/15',
  correct: 'border-emerald-400/70 bg-emerald-500/15',
  incorrect: 'border-red-400/70 bg-red-500/15',
}
const badgeClass: Record<OptionState, string> = {
  idle: 'border-white/20 text-white/70',
  selected: 'border-sky-300 bg-sky-400 text-black',
  correct: 'border-emerald-300 bg-emerald-400 text-black',
  incorrect: 'border-red-300 bg-red-400 text-black',
}

const selectedLabel = computed(
  () => props.question.displayOptions.find((o) => o.key === props.selectedKey)?.label ?? null,
)
const answerOption = computed(
  () => props.question.displayOptions.find((o) => o.key === props.question.answer) ?? null,
)
const verdict = computed<'correct' | 'incorrect' | 'skipped'>(() => {
  if (!props.selectedKey) return 'skipped'
  return props.selectedKey === props.question.answer ? 'correct' : 'incorrect'
})
const legacyLabel = computed(() => {
  const k = props.question.legacy_key
  if (!k) return null
  return props.question.displayOptions.find((o) => o.key === k)?.label ?? k
})

const showHintButton = computed(() => props.mode === 'practice' && !!props.question.hint)
</script>

<template>
  <!-- ═════════════ mode=exam: PMT-EMS ExamSys replica (light) ═════════════ -->
  <article v-if="isExam" class="exam-q">
    <div class="q-no">Câu {{ index }}:</div>
    <div class="q-stem">{{ question.stem }}</div>

    <figure v-if="imageSrc" class="q-fig">
      <img :src="imageSrc" :alt="`Hình minh họa câu ${index}`" loading="lazy" decoding="async" />
    </figure>

    <div role="radiogroup" :aria-label="`Câu ${index}`">
      <label
        v-for="opt in question.displayOptions"
        :key="opt.key"
        class="q-opt"
        :class="{
          'is-selected': optionState(opt.key) === 'selected',
          'is-correct': optionState(opt.key) === 'correct',
          'is-incorrect': optionState(opt.key) === 'incorrect',
          'is-locked': reveal,
        }"
      >
        <input
          type="radio"
          class="q-radio"
          :name="`q-${question.id}`"
          :value="opt.key"
          :checked="selectedKey === opt.key"
          :disabled="reveal"
          @change="emit('select', opt.key)"
        />
        <span class="q-key">{{ opt.label }}.</span>
        <span class="q-text">{{ opt.text }}</span>
        <span v-if="reveal && opt.key === question.answer" class="q-tag q-tag-ok"
          >(Đáp án đúng)</span
        >
        <span v-else-if="reveal && opt.key === selectedKey" class="q-tag q-tag-bad"
          >(Bạn chọn)</span
        >
      </label>
    </div>

    <!-- Post-submit review -->
    <section v-if="reveal" class="q-fb" aria-live="polite">
      <p class="q-verdict" :class="`v-${verdict}`">
        {{
          verdict === 'correct'
            ? 'Chính xác'
            : verdict === 'incorrect'
              ? `Chưa đúng (bạn chọn ${selectedLabel})`
              : 'Chưa trả lời'
        }}
        <span class="q-verdict-ans">
          · Đáp án đúng: <b class="tabnum">{{ question.displayAnswerLabel }}</b>
          <template v-if="answerOption"> — {{ answerOption.text }}</template>
        </span>
      </p>

      <div v-if="question.status === 'conflict'" class="q-box q-conflict">
        <p class="q-box-title">Cảnh báo: đáp án đang có mâu thuẫn giữa các nguồn</p>
        <p v-if="legacyLabel">
          Đáp án đánh dấu trong file cũ: <b class="tabnum">{{ legacyLabel }}</b>
        </p>
        <p v-if="question.student_note" class="pre">
          Ghi chú của sinh viên: {{ question.student_note }}
        </p>
      </div>

      <pre v-if="question.formula_work" class="q-formula">{{ question.formula_work }}</pre>

      <div v-if="question.textbook_excerpt" class="q-box q-book">
        <p class="q-box-title">Bám sát Giáo trình YDS</p>
        <p class="pre">{{ question.textbook_excerpt }}</p>
      </div>

      <div class="q-box">
        <p class="q-box-title">Lý luận &amp; Phân tích</p>
        <p class="pre">{{ question.explanation }}</p>
      </div>
    </section>
  </article>

  <!-- ═════════════ mode=practice: Isolde dark glass ═════════════ -->
  <article
    v-else
    class="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md sm:p-6"
  >
    <header class="flex flex-wrap items-center gap-2">
      <h2 class="font-mono text-base font-semibold tabular-nums">Câu {{ index }}/{{ total }}</h2>
      <span class="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs text-white/70">
        {{ question.cohort }} · {{ question.group_name }}
      </span>
      <span
        v-if="reveal && question.status === 'conflict'"
        class="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-300"
      >
        Conflict
      </span>
      <div class="ml-auto flex items-center gap-1.5">
        <button
          v-if="showHintButton"
          type="button"
          class="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-sm text-white/75 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60 disabled:opacity-40"
          :aria-pressed="hintRevealed"
          :disabled="locked"
          @click="emit('toggle-hint')"
        >
          <span class="i-solar-lightbulb-linear text-base" aria-hidden="true" />
          Gợi ý
        </button>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition focus-visible:outline-2 focus-visible:outline-white/60"
          :class="
            flagged
              ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
              : 'border-white/10 text-white/75 hover:bg-white/10'
          "
          :aria-pressed="flagged"
          @click="emit('toggle-flag')"
        >
          <span
            :class="flagged ? 'i-solar-flag-bold' : 'i-solar-flag-linear'"
            class="text-base"
            aria-hidden="true"
          />
          {{ flagged ? 'Bỏ cờ' : 'Cắm cờ' }}
        </button>
      </div>
    </header>

    <p
      v-if="hintRevealed && question.hint"
      class="mt-3 rounded-2xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm leading-relaxed text-sky-100"
    >
      {{ question.hint }}
    </p>

    <p class="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-white/90 sm:text-base">
      {{ question.stem }}
    </p>

    <figure
      v-if="imageSrc"
      class="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40"
    >
      <img
        :src="imageSrc"
        :alt="`Hình minh họa câu ${index}`"
        loading="lazy"
        decoding="async"
        class="mx-auto max-h-[28rem] w-auto max-w-full object-contain"
      />
    </figure>

    <div class="mt-5 grid gap-2.5" role="group" :aria-label="`Đáp án câu ${index}`">
      <button
        v-for="opt in question.displayOptions"
        :key="opt.key"
        type="button"
        class="flex min-h-[44px] w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-white/60 disabled:cursor-default"
        :class="optionClass[optionState(opt.key)]"
        :disabled="!interactive || locked"
        :aria-pressed="optionState(opt.key) === 'selected'"
        @click="emit('select', opt.key)"
      >
        <span
          class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-sm font-semibold tabular-nums"
          :class="badgeClass[optionState(opt.key)]"
        >
          {{ opt.label }}
        </span>
        <span class="whitespace-pre-line text-[15px] leading-snug text-white/90">{{
          opt.text
        }}</span>
      </button>
    </div>

    <Transition name="fb">
      <div v-if="reveal" class="fb-wrap">
        <div class="fb-inner">
          <section class="mt-5 space-y-3 border-t border-white/10 pt-5" aria-live="polite">
            <header class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-3 py-1 text-sm font-semibold"
                :class="{
                  'bg-emerald-500/15 text-emerald-300': verdict === 'correct',
                  'bg-red-500/15 text-red-300': verdict === 'incorrect',
                  'bg-white/10 text-white/70': verdict === 'skipped',
                }"
              >
                {{
                  verdict === 'correct'
                    ? 'Chính xác'
                    : verdict === 'incorrect'
                      ? `Chưa đúng (bạn chọn ${selectedLabel})`
                      : 'Chưa trả lời'
                }}
              </span>
              <span class="text-sm text-white/80">
                Đáp án đúng:
                <strong class="font-mono tabular-nums">{{ question.displayAnswerLabel }}</strong>
                <template v-if="answerOption"> · {{ answerOption.text }}</template>
              </span>
              <button
                v-if="question.note_ref"
                type="button"
                class="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-sm text-white/80 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60"
                @click="emit('open-note', question.note_ref)"
              >
                <span class="i-solar-book-2-linear text-base" aria-hidden="true" />
                Mở bài giảng gốc
              </button>
            </header>

            <div
              v-if="question.status === 'conflict'"
              class="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100"
            >
              <p class="font-semibold text-amber-200">
                Cảnh báo: đáp án đang có mâu thuẫn giữa các nguồn
              </p>
              <p v-if="legacyLabel" class="mt-1.5">
                Đáp án đánh dấu trong file cũ:
                <strong class="font-mono tabular-nums">{{ legacyLabel }}</strong>
              </p>
              <p v-if="question.student_note" class="mt-1 whitespace-pre-line">
                Ghi chú của sinh viên: {{ question.student_note }}
              </p>
            </div>

            <pre
              v-if="question.formula_work"
              class="overflow-x-auto rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-[13px] leading-relaxed tabular-nums text-white/85"
              >{{ question.formula_work }}</pre>

            <div
              v-if="question.textbook_excerpt"
              class="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4"
            >
              <h3 class="text-sm font-semibold text-emerald-200">Bám sát Giáo trình YDS</h3>
              <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/80">
                {{ question.textbook_excerpt }}
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 class="text-sm font-semibold text-white/90">Lý luận &amp; Phân tích</h3>
              <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/80">
                {{ question.explanation }}
              </p>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </article>
</template>

<style scoped>
/* ── practice feedback slide-down ── */
.fb-wrap {
  display: grid;
  grid-template-rows: 1fr;
}
.fb-inner {
  min-height: 0;
  overflow: hidden;
}
.fb-enter-active,
.fb-leave-active {
  transition:
    grid-template-rows 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 240ms ease;
}
.fb-enter-from,
.fb-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fb-enter-active,
  .fb-leave-active {
    transition: none;
  }
}

/* ── exam (PMT-EMS replica) ── */
.exam-q {
  font-family: 'Times New Roman', Times, serif;
  color: #111;
}
.tabnum {
  font-variant-numeric: tabular-nums;
}
.q-no {
  font-weight: 700;
  font-size: 16px;
  color: #0033cc;
  margin-bottom: 6px;
  font-variant-numeric: tabular-nums;
}
.q-stem {
  font-size: 16px;
  line-height: 1.55;
  margin-bottom: 16px;
  white-space: pre-line;
}
.q-fig {
  margin: 0 0 16px;
  border: 1px solid #d0d0d0;
  background: #fafafa;
  padding: 6px;
  text-align: center;
}
.q-fig img {
  max-width: 100%;
  max-height: 28rem;
  object-fit: contain;
  display: inline-block;
}
.q-opt {
  display: flex;
  align-items: flex-start;
  padding: 10px 8px;
  border-bottom: 1px solid #efefef;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.1s;
}
.q-opt:hover:not(.is-locked) {
  background: #f3f6fa;
}
.q-opt.is-selected {
  background: #dce8fc;
  font-weight: 600;
}
.q-opt.is-correct {
  background: #e6f4ea;
}
.q-opt.is-incorrect {
  background: #fadbd8;
}
.q-opt.is-locked {
  cursor: default;
}
.q-radio {
  margin: 5px 8px 0 0;
  flex-shrink: 0;
  accent-color: #0033cc;
}
.q-key {
  width: 36px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.q-text {
  flex: 1;
  white-space: pre-line;
}
.q-tag {
  margin-left: 10px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.q-tag-ok {
  color: #1e6b35;
}
.q-tag-bad {
  color: #c00000;
}

.q-fb {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #b8a672;
  font-family: Arial, sans-serif;
  font-size: 13.5px;
  line-height: 1.6;
}
.q-verdict {
  font-weight: 700;
  margin: 0 0 10px;
}
.q-verdict.v-correct {
  color: #1e6b35;
}
.q-verdict.v-incorrect {
  color: #c00000;
}
.q-verdict.v-skipped {
  color: #555;
}
.q-verdict-ans {
  font-weight: 400;
  color: #111;
}
.q-box {
  border: 1px solid #c5b686;
  background: #faf6e6;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.q-box p {
  margin: 0;
}
.q-box-title {
  font-weight: 700;
  margin-bottom: 3px !important;
}
.q-conflict {
  border-color: #d9a400;
  background: #fff3cd;
}
.q-book {
  border-color: #9bc4a8;
  background: #eef7f0;
}
.pre {
  white-space: pre-line;
}
.q-formula {
  overflow-x: auto;
  margin: 0 0 10px;
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  background: #f5f5f5;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #111;
}
</style>
