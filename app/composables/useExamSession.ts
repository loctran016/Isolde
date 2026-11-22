// composables/useExamSession.ts
import { computed, onMounted, onUnmounted, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type {
  DisplayOption,
  ExamFilterQuery,
  ExamHistoryRecord,
  ExamPaletteItem,
  ExamQuestion,
  ExamScoreSummary,
  PaletteItemState,
  PreparedQuestion,
  ReviewFilter,
  SubjectQuestionBank,
} from '~/types/quiz.types'

export const EXAM_HISTORY_KEY = 'isolde_exam_history'
const HISTORY_LIMIT = 100
const WARNING_THRESHOLD_SEC = 300
const SECONDS_PER_QUESTION = 40
const DISPLAY_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

// Options such as "Cả A và B đúng" or "Tất cả các ý trên" depend on position/letters,
// so those questions keep their original option order even when shuffle is on.
const POSITION_DEPENDENT_OPTION =
  /(^|\s)(cả|tất cả)\s+(các\s+)?(ý\s+)?[A-F]\b|\b[A-F]\s*(và|,|&)\s*[A-F]\b|\b(tất cả|không có)\s+(các\s+)?(ý|đáp án)\b/i

// ───────────────────────── Query & history helpers (also used by ExamCheckInDialog) ─────────────────────────

const firstValue = (v: unknown): string =>
  Array.isArray(v) ? String(v[0] ?? '') : typeof v === 'string' ? v : ''

export function parseExamQuery(raw: Record<string, unknown>): ExamFilterQuery {
  const group = firstValue(raw.group) || 'all'
  return {
    mode: firstValue(raw.mode) === 'exam' ? 'exam' : 'practice',
    exam: firstValue(raw.exam) || 'all',
    group: /^[1-8]$/.test(group) ? group : 'all',
    conflict: firstValue(raw.conflict) === '1' ? '1' : '0',
    shuffle: firstValue(raw.shuffle) === '1' ? '1' : '0',
    time: firstValue(raw.time),
    name: firstValue(raw.name),
    mssv: firstValue(raw.mssv),
  }
}

export function examHistoryKey(
  subject: string,
  exam: string,
  group: string,
  conflict: string,
): string {
  return `${subject}|${exam}|${group}|${conflict}`
}

export function readExamHistory(): ExamHistoryRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EXAM_HISTORY_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as ExamHistoryRecord[]) : []
  } catch {
    return []
  }
}

export function findLastExamRecord(
  subject: string,
  exam: string,
  group: string,
  conflict: string,
): ExamHistoryRecord | null {
  const key = examHistoryKey(subject, exam, group, conflict)
  const hits = readExamHistory().filter((r) => r.key === key)
  return hits.length ? hits[hits.length - 1]! : null
}

function writeExamRecord(record: ExamHistoryRecord): void {
  if (typeof window === 'undefined') return
  try {
    const next = [...readExamHistory(), record].slice(-HISTORY_LIMIT)
    window.localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* storage full / private mode: history is best-effort */
  }
}

// ───────────────────────── Internal helpers ─────────────────────────

function shuffled<T>(input: readonly T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function prepareQuestion(q: ExamQuestion, shuffleOptions: boolean): PreparedQuestion {
  const canShuffle =
    shuffleOptions &&
    q.options.length > 1 &&
    !q.options.some((o) => POSITION_DEPENDENT_OPTION.test(o.text))
  const ordered = canShuffle ? shuffled(q.options) : [...q.options]
  const displayOptions: DisplayOption[] = ordered.map((o, i) => ({
    key: o.key, // canonical key is never altered: grading is always selectedKey === question.answer
    text: o.text,
    label: canShuffle ? (DISPLAY_LABELS[i] ?? o.key) : o.key,
  }))
  const answerOpt = displayOptions.find((o) => o.key === q.answer)
  return { ...q, displayOptions, displayAnswerLabel: answerOpt?.label ?? q.answer }
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const safeSegment = (s: string) => /^[\w.-]+$/.test(s)

// ───────────────────────── Composable ─────────────────────────

export function useExamSession(
  subject: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<ExamFilterQuery>,
) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const subjectLabel = ref('')

  const questions = ref<PreparedQuestion[]>([])
  const currentIndex = ref(0)

  const answers = ref<Record<string, string>>({})
  const flagged = ref<Record<string, boolean>>({})
  const revealedHints = ref<Record<string, boolean>>({})

  const submitted = ref(false)
  const autoSubmitted = ref(false)
  const summary = ref<ExamScoreSummary | null>(null)
  const reviewFilter = ref<ReviewFilter>('all')

  const activeNoteRef = ref<string | null>(null)

  const totalSec = ref(0)
  const startedAt = ref(0)
  const endAt = ref(0)
  const nowTick = ref(Date.now())
  let handle: ReturnType<typeof setInterval> | null = null

  const mode = computed(() => toValue(query).mode)
  const isExam = computed(() => mode.value === 'exam')
  const isPractice = computed(() => mode.value === 'practice')

  // ── Timer (timestamp based, so iOS throttling of background tabs never drifts the clock) ──
  const remainingSec = computed(() => {
    if (!isExam.value) return 0
    return Math.max(0, Math.ceil((endAt.value - nowTick.value) / 1000))
  })
  const formattedTime = computed(
    () => `${pad2(Math.floor(remainingSec.value / 60))}:${pad2(remainingSec.value % 60)}`,
  )
  const isWarning = computed(
    () =>
      isExam.value &&
      !submitted.value &&
      remainingSec.value > 0 &&
      remainingSec.value < WARNING_THRESHOLD_SEC,
  )

  function tick() {
    nowTick.value = Date.now()
    if (isExam.value && !submitted.value && endAt.value > 0 && nowTick.value >= endAt.value) {
      submitExam(true)
    }
  }
  function onVisibility() {
    if (document.visibilityState === 'visible') tick()
  }
  function startTimer() {
    stopTimer()
    startedAt.value = Date.now()
    nowTick.value = startedAt.value
    endAt.value = isExam.value ? startedAt.value + totalSec.value * 1000 : 0
    handle = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', onVisibility)
  }
  function stopTimer() {
    if (handle) {
      clearInterval(handle)
      handle = null
    }
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', onVisibility)
  }

  // ── Loading ──
  async function load() {
    stopTimer()
    loading.value = true
    error.value = null
    const sub = toValue(subject)
    const q = toValue(query)
    try {
      if (!safeSegment(sub) || (q.exam !== 'all' && !safeSegment(q.exam)))
        throw new Error('Tham số học phần hoặc bộ đề không hợp lệ.')
      const file = q.exam === 'all' ? 'bank' : q.exam
      const bank = await $fetch<SubjectQuestionBank>(`/data/exams/${sub}/${file}.json`)
      subjectLabel.value = bank.subject_label

      let list = bank.questions
      if (q.exam !== 'all') list = list.filter((x) => x.exam_id === q.exam)
      if (q.group !== 'all') list = list.filter((x) => String(x.group_id) === q.group)
      if (q.conflict === '1') list = list.filter((x) => x.status === 'conflict')

      const doShuffle = q.shuffle === '1'
      const ordered = doShuffle ? shuffled(list) : list
      questions.value = ordered.map((x) => prepareQuestion(x, doShuffle))

      answers.value = {}
      flagged.value = {}
      revealedHints.value = {}
      submitted.value = false
      autoSubmitted.value = false
      summary.value = null
      reviewFilter.value = 'all'
      activeNoteRef.value = null
      currentIndex.value = 0

      const minutes = Number(q.time)
      totalSec.value =
        Number.isFinite(minutes) && minutes > 0
          ? Math.round(minutes * 60)
          : Math.max(60, questions.value.length * SECONDS_PER_QUESTION)

      if (questions.value.length) startTimer()
    } catch (e) {
      questions.value = []
      error.value = e instanceof Error && e.message ? e.message : 'Không tải được dữ liệu đề thi.'
    } finally {
      loading.value = false
    }
  }

  // ── Derived question state ──
  const fullIndexById = computed(() => {
    const map = new Map<string, number>()
    questions.value.forEach((q, i) => map.set(q.id, i))
    return map
  })

  function isRevealed(q: PreparedQuestion): boolean {
    return submitted.value || (isPractice.value && !!answers.value[q.id])
  }

  function isWrong(q: PreparedQuestion): boolean {
    return answers.value[q.id] !== q.answer
  }

  function questionState(q: PreparedQuestion): PaletteItemState {
    const sel = answers.value[q.id]
    if (!sel) return 'unanswered'
    if (isRevealed(q)) return sel === q.answer ? 'correct' : 'incorrect'
    return 'answered'
  }

  const visibleQuestions = computed(() => {
    if (!submitted.value || reviewFilter.value === 'all') return questions.value
    if (reviewFilter.value === 'wrong') return questions.value.filter(isWrong)
    return questions.value.filter((q) => q.status === 'conflict')
  })

  const currentQuestion = computed<PreparedQuestion | null>(
    () => visibleQuestions.value[currentIndex.value] ?? null,
  )
  const currentNumber = computed(() =>
    currentQuestion.value ? (fullIndexById.value.get(currentQuestion.value.id) ?? 0) + 1 : 0,
  )

  const paletteItems = computed<ExamPaletteItem[]>(() =>
    visibleQuestions.value.map((q, i) => ({
      id: q.id,
      no: (fullIndexById.value.get(q.id) ?? i) + 1,
      state: questionState(q),
      flagged: !!flagged.value[q.id],
      current: i === currentIndex.value,
    })),
  )

  const totalCount = computed(() => questions.value.length)
  const answeredCount = computed(() => questions.value.filter((q) => !!answers.value[q.id]).length)
  const unansweredCount = computed(() => totalCount.value - answeredCount.value)
  const flaggedCount = computed(() => questions.value.filter((q) => flagged.value[q.id]).length)
  const wrongCount = computed(() => questions.value.filter(isWrong).length)
  const conflictCount = computed(
    () => questions.value.filter((q) => q.status === 'conflict').length,
  )

  // ── Navigation ──
  function goTo(index: number) {
    if (!visibleQuestions.value.length) return
    currentIndex.value = Math.min(Math.max(0, index), visibleQuestions.value.length - 1)
  }
  function goToId(id: string) {
    let idx = visibleQuestions.value.findIndex((q) => q.id === id)
    if (idx < 0) {
      reviewFilter.value = 'all'
      idx = questions.value.findIndex((q) => q.id === id)
    }
    if (idx >= 0) currentIndex.value = idx
  }
  const next = () => goTo(currentIndex.value + 1)
  const prev = () => goTo(currentIndex.value - 1)
  const hasNext = computed(() => currentIndex.value < visibleQuestions.value.length - 1)
  const hasPrev = computed(() => currentIndex.value > 0)

  // ── Answering ──
  function selectAnswer(questionId: string, key: string) {
    if (submitted.value) return
    const q = questions.value.find((x) => x.id === questionId)
    if (!q || !q.displayOptions.some((o) => o.key === key)) return
    const existing = answers.value[questionId]
    if (isPractice.value) {
      if (existing) return // practice: locked at first click
      answers.value = { ...answers.value, [questionId]: key }
      return
    }
    // exam: change freely; tapping the same option again clears the answer
    if (existing === key) {
      const { [questionId]: _removed, ...rest } = answers.value
      answers.value = rest
    } else {
      answers.value = { ...answers.value, [questionId]: key }
    }
  }

  function toggleFlag(questionId: string) {
    flagged.value = { ...flagged.value, [questionId]: !flagged.value[questionId] }
  }

  function toggleHint(questionId: string) {
    if (!isPractice.value) return
    revealedHints.value = { ...revealedHints.value, [questionId]: !revealedHints.value[questionId] }
  }

  // ── Submit ──
  function submitExam(auto = false) {
    if (submitted.value || !questions.value.length) return
    stopTimer()
    const rawElapsed = Math.max(0, Math.round((Date.now() - startedAt.value) / 1000))
    const elapsedSec = isExam.value ? Math.min(rawElapsed, totalSec.value) : rawElapsed
    const correctCount = questions.value.filter((q) => answers.value[q.id] === q.answer).length
    const total = questions.value.length
    summary.value = {
      correctCount,
      totalCount: total,
      answeredCount: answeredCount.value,
      percentage: total ? Math.round((correctCount / total) * 1000) / 10 : 0,
      elapsedSec,
    }
    autoSubmitted.value = auto
    submitted.value = true
    activeNoteRef.value = null

    const q = toValue(query)
    const sub = toValue(subject)
    writeExamRecord({
      key: examHistoryKey(sub, q.exam, q.group, q.conflict),
      subject: sub,
      exam: q.exam,
      group: q.group,
      conflict: q.conflict,
      mode: q.mode,
      correctCount,
      totalCount: total,
      percentage: summary.value.percentage,
      elapsedSec,
      finishedAt: new Date().toISOString(),
    })
  }

  function setReviewFilter(filter: ReviewFilter) {
    reviewFilter.value = filter
    currentIndex.value = 0
  }

  // ── Note reference drawer ──
  function openNoteRef(ref: string | null) {
    if (!ref) return
    if (isPractice.value || submitted.value) activeNoteRef.value = ref
  }
  function closeNoteRef() {
    activeNoteRef.value = null
  }

  onMounted(() => {
    // Timer is started by load(); this hook only guarantees a clean slate if the page remounts.
    nowTick.value = Date.now()
  })
  onUnmounted(stopTimer)

  return {
    // status
    loading,
    error,
    subjectLabel,
    load,
    // mode
    mode,
    isExam,
    isPractice,
    // questions
    questions,
    visibleQuestions,
    currentIndex,
    currentQuestion,
    currentNumber,
    paletteItems,
    hasNext,
    hasPrev,
    goTo,
    goToId,
    next,
    prev,
    // answers
    answers,
    flagged,
    revealedHints,
    selectAnswer,
    toggleFlag,
    toggleHint,
    isRevealed,
    questionState,
    // counts
    totalCount,
    answeredCount,
    unansweredCount,
    flaggedCount,
    wrongCount,
    conflictCount,
    // timer
    totalSec,
    remainingSec,
    formattedTime,
    isWarning,
    // submit & review
    submitted,
    autoSubmitted,
    summary,
    submitExam,
    reviewFilter,
    setReviewFilter,
    // note drawer
    activeNoteRef,
    openNoteRef,
    closeNoteRef,
  }
}
