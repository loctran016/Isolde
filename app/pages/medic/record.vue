<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { checklists } from '~/data/medic'

// ---------- Checklist data ----------
const displayNameByKey: Record<string, string> = {
  'tieu-phan-den': 'Tiêu phân đen',
  'non-ra-mau': 'Nôn ra máu',
  'dau-nguc': 'Đau ngực',
  'kho-tho': 'Khó thở',
  'ho-ra-mau': 'Ho ra máu',
  'sot': 'Sốt',
  'tang-huyet-ap': 'Tăng huyết áp',
  'bang-bung': 'Báng bụng',
  'vang-da': 'Vàng da',
  'tieu-mau': 'Tiểu máu',
  'tieu-it': 'Tiểu ít',
  'phu': 'Phù',
}

const displayNameToKey = Object.fromEntries(
  Object.entries(displayNameByKey).map(([key, label]) => [label, key])
)

// Reason‑for‑visit select
const reasonDisplay = ref('Tiêu phân đen')
const selectedChecklistKey = computed(() => displayNameToKey[reasonDisplay.value] ?? 'tieu-phan-den')

// Split the checklist sections
const allSections = computed(() => checklists[selectedChecklistKey.value] ?? [])

// Only HỎI BỆNH SỬ for the timeline
const historySections = computed(() =>
  allSections.value.filter(s => s.title === 'HỎI BỆNH SỬ')
)

// Only TIỀN CĂN for the separate past history block
const tienCanSections = computed(() =>
  allSections.value.filter(s => s.title === 'TIỀN CĂN')
)

// ---------- Patient info ----------
const patientName = ref('')
const dob = ref('')
const gender = ref('')
const occupation = ref('')
const address = ref('')
const ward = ref('')
const admissionTime = ref('')

const age = computed(() => {
  if (!dob.value) return ''
  const birth = new Date(dob.value)
  const today = new Date()
  let a = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--
  return a > 0 ? `${a} tuổi` : ''
})

// ---------- Timeline events with per‑event hiding ----------
interface TimelineEvent {
  id: string
  timeLabel: string
  answers: Record<string, string>
  hiddenSymptomIds: string[]      // IDs of hidden sub‑questions
}
let eventCounter = 0

function createEmptyHistoryAnswers(): Record<string, string> {
  const ans: Record<string, string> = {}
  for (const section of historySections.value) {
    for (const mq of section.mainQuestions) {
      for (const sq of mq.subQuestions) {
        ans[sq.id] = ''
      }
    }
  }
  return ans
}

const timeline = ref<TimelineEvent[]>([
  {
    id: `ev${++eventCounter}`,
    timeLabel: '',
    answers: createEmptyHistoryAnswers(),
    hiddenSymptomIds: []            // start fully visible
  }
])

// When checklist changes, re‑init timeline and tiền căn
watch(selectedChecklistKey, () => {
  timeline.value.forEach(ev => {
    ev.answers = createEmptyHistoryAnswers()
    ev.hiddenSymptomIds = []        // reset visibility
  })
  tienCanAnswers.value = createEmptyTienCanAnswers()
})

function addEvent() {
  timeline.value.push({
    id: `ev${++eventCounter}`,
    timeLabel: '',
    answers: createEmptyHistoryAnswers(),
    hiddenSymptomIds: []
  })
}
function removeEvent(index: number) {
  if (timeline.value.length > 1) timeline.value.splice(index, 1)
}

// Hide a symptom row
function hideSymptom(eventIdx: number, symptomId: string) {
  const ev = timeline.value[eventIdx]
  if (!ev.hiddenSymptomIds.includes(symptomId)) {
    ev.hiddenSymptomIds.push(symptomId)
    // optionally clear the answer
    ev.answers[symptomId] = ''
  }
}

// Restore a previously hidden symptom
function restoreSymptom(eventIdx: number, symptomId: string) {
  const ev = timeline.value[eventIdx]
  const idx = ev.hiddenSymptomIds.indexOf(symptomId)
  if (idx !== -1) ev.hiddenSymptomIds.splice(idx, 1)
}

// Which event's restore popup is open (-1 = none)
const restoreEventIdx = ref(-1)

// Computed list of hidden symptoms for the currently selected restore event
const hiddenSymptomsForRestore = computed(() => {
  if (restoreEventIdx.value === -1) return []
  const ev = timeline.value[restoreEventIdx.value]
  const allIds = Object.keys(ev.answers)
  return allIds.filter(id => ev.hiddenSymptomIds.includes(id))
})

// Get the label of a symptom id by searching through all sub‑questions
function symptomLabel(id: string): string {
  for (const section of historySections.value) {
    for (const mq of section.mainQuestions) {
      for (const sq of mq.subQuestions) {
        if (sq.id === id) return sq.text
      }
    }
  }
  return id
}

// ---------- TIỀN CĂN (separate, not in timeline) ----------
function createEmptyTienCanAnswers(): Record<string, string> {
  const ans: Record<string, string> = {}
  for (const section of tienCanSections.value) {
    for (const mq of section.mainQuestions) {
      for (const sq of mq.subQuestions) {
        ans[sq.id] = ''
      }
    }
  }
  return ans
}
const tienCanAnswers = ref<Record<string, string>>(createEmptyTienCanAnswers())

// ---------- Physical Exam ----------
const vitalSigns = ref({
  heartRate: '', bloodPressure: '', temperature: '', spo2: '', respiratoryRate: ''
})
const examSystems = ref({
  general: '', headNeck: '', chest: '', heart: '', lungs: '', abdomen: '', neuroMuscular: ''
})

// ---------- Labs ----------
interface LabEntry {
  testName: string
  date: string
  result: string
  unit: string
  reference: string
}
const labs = ref<LabEntry[]>([{ testName: '', date: '', result: '', unit: '', reference: '' }])
function addLab() { labs.value.push({ testName: '', date: '', result: '', unit: '', reference: '' }) }
function removeLab(idx: number) { if (labs.value.length > 1) labs.value.splice(idx, 1) }

// ---------- Diagnosis & Reasoning ----------
const workingDiagnosis = ref('')
const differentials = ref([''])
const finalDiagnosis = ref('')
const reasoning = ref('')

function addDifferential() { differentials.value.push('') }
function removeDifferential(idx: number) { if (differentials.value.length > 1) differentials.value.splice(idx, 1) }

// ---------- Saving ----------
const supabase = useSupabaseClient()
const saving = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)

async function handleSave() {
  if (!patientName.value.trim() || !dob.value) {
    saveError.value = 'Vui lòng điền ít nhất Họ tên và Ngày tháng năm sinh.'
    return
  }

  saving.value = true
  saveError.value = null
  saved.value = false

  const record = {
    patient_name: patientName.value.trim(),
    dob: dob.value,
    gender: gender.value.trim(),
    occupation: occupation.value.trim(),
    address: address.value.trim(),
    ward: ward.value.trim(),
    admission_time: admissionTime.value || null,
    chief_complaint: reasonDisplay.value,
    timeline: JSON.parse(JSON.stringify(timeline.value)),
    tien_can: JSON.parse(JSON.stringify(tienCanAnswers.value)),
    physical_exam: {
      vitalSigns: JSON.parse(JSON.stringify(vitalSigns.value)),
      systems: JSON.parse(JSON.stringify(examSystems.value)),
    },
    lab_results: JSON.parse(JSON.stringify(labs.value.filter(l => l.testName.trim() !== ''))),
    diagnosis: {
      working: workingDiagnosis.value,
      differentials: differentials.value.filter(d => d.trim() !== ''),
      final: finalDiagnosis.value,
    },
    reasoning: reasoning.value,
    summary: '',
  }

  try {
    const { error } = await supabase.from('medical_records').insert(record)
    if (error) throw error
    saved.value = true
  } catch (e: any) {
    saveError.value = e.message || 'Lỗi khi lưu dữ liệu'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-6 font-sans dark:text-gray-100 space-y-6">
    <h1 class="text-xl font-bold">BỆNH ÁN TOÀN DIỆN</h1>

    <!-- I. Hành chính -->
    <section class="card p-4">
      <h2 class="card-title">I. Hành chính</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Họ và tên</span>
          <input v-model="patientName" type="text" class="input-field" placeholder="Nguyễn Sơn L." />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Ngày tháng năm sinh</span>
          <input v-model="dob" type="date" class="input-field" />
        </label>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Tuổi</span>
          <span class="text-sm py-1 opacity-80">{{ age || '—' }}</span>
        </div>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Giới tính</span>
          <select v-model="gender" class="input-field">
            <option value="">Chọn</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Nghề nghiệp</span>
          <input v-model="occupation" type="text" class="input-field" placeholder="Bảo vệ" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Địa chỉ</span>
          <input v-model="address" type="text" class="input-field" placeholder="Tây Ninh" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Nằm viện tại</span>
          <input v-model="ward" type="text" class="input-field" placeholder="Khoa / Phòng / Giường" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Thời gian vào viện</span>
          <input v-model="admissionTime" type="datetime-local" class="input-field" />
        </label>
      </div>
    </section>

    <!-- II. Lý do nhập viện -->
    <section class="card p-4">
      <h2 class="card-title">II. Lý do nhập viện</h2>
      <div class="flex items-center gap-3 mt-3">
        <span class="text-sm opacity-80">Lí do:</span>
        <Select v-model="reasonDisplay" :options="Object.keys(displayNameByKey).map(k => displayNameByKey[k])" class="w-64" />
      </div>
    </section>

    <!-- III. Bệnh sử (Timeline with toggleable symptoms) -->
    <section class="card p-4">
      <h2 class="card-title">III. Bệnh sử (Theo mốc thời gian)</h2>
      <div class="space-y-4 mt-3">
        <div v-for="(ev, idx) in timeline" :key="ev.id" class="border border-stone-200 dark:border-stone-700 rounded-lg p-3">
          <div class="flex items-start justify-between gap-2 mb-3">
            <input v-model="ev.timeLabel" type="text" class="input-field flex-1" placeholder="VD: CNV 19 giờ, 10/07/2026" />
            <div class="flex items-center gap-2">
              <!-- Restore button -->
              <button
                @click="restoreEventIdx = (restoreEventIdx === idx ? -1 : idx)"
                class="text-xs text-purple-600 hover:underline whitespace-nowrap"
              >
                + Khôi phục triệu chứng
              </button>
              <button v-if="timeline.length > 1" @click="removeEvent(idx)" class="text-red-500 hover:text-red-700 text-sm">Xoá</button>
            </div>
          </div>

          <!-- Restore popup -->
          <div v-if="restoreEventIdx === idx" class="mb-3 p-2 bg-white dark:bg-stone-800 border rounded shadow">
            <p class="text-xs font-medium mb-1">Triệu chứng đã ẩn:</p>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="sid in hiddenSymptomsForRestore"
                :key="sid"
                @click="restoreSymptom(idx, sid)"
                class="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full hover:bg-purple-200 transition-colors"
              >
                {{ symptomLabel(sid) }}
              </button>
              <span v-if="hiddenSymptomsForRestore.length === 0" class="text-xs opacity-50">Không có</span>
            </div>
          </div>

          <!-- Render history sub‑questions, only visible ones -->
          <div v-for="section in historySections" :key="section.title">
            <div v-for="mq in section.mainQuestions" :key="mq.id" class="mb-3">
              <h4 class="text-sm font-semibold opacity-90 mb-2">{{ mq.title }}</h4>
              <div v-if="mq.subQuestions.length > 0" class="ml-3 space-y-2">
                <div
                  v-for="sq in mq.subQuestions"
                  :key="sq.id"
                  v-show="!ev.hiddenSymptomIds.includes(sq.id)"
                  class="flex flex-col gap-1"
                >
                  <div class="flex items-center gap-2">
                    <label :for="`q-${ev.id}-${sq.id}`" class="text-sm opacity-70 flex-1">{{ sq.text }}</label>
                    <button
                      @click="hideSymptom(idx, sq.id)"
                      class="text-stone-400 hover:text-red-500 transition-colors shrink-0"
                      :aria-label="`Ẩn triệu chứng: ${sq.text}`"
                    >
                      <div class="i-mdi:trash-can-outline text-sm" />
                    </button>
                  </div>
                  <input
                    :id="`q-${ev.id}-${sq.id}`"
                    v-model="ev.answers[sq.id]"
                    type="text"
                    class="input-field"
                    placeholder="Nhập câu trả lời..."
                  />
                </div>
                <!-- If all sub-questions are hidden -->
                <p v-if="mq.subQuestions.every(sq => ev.hiddenSymptomIds.includes(sq.id))" class="text-xs opacity-50 italic ml-3">
                  Tất cả triệu chứng đã bị ẩn.
                </p>
              </div>
              <p v-else class="ml-3 text-xs opacity-60 italic">Quan sát kỹ năng này trong quá trình hỏi bệnh.</p>
            </div>
          </div>
        </div>
        <button @click="addEvent" class="text-sm text-purple-600 hover:underline">+ Thêm mốc thời gian</button>
      </div>
    </section>

    <!-- IV. Tiền căn (separate) -->
    <section v-if="tienCanSections.length > 0" class="card p-4">
      <h2 class="card-title">IV. Tiền căn</h2>
      <div class="space-y-4 mt-3">
        <div v-for="section in tienCanSections" :key="section.title">
          <div v-for="mq in section.mainQuestions" :key="mq.id" class="mb-3">
            <h4 class="text-sm font-semibold opacity-90 mb-2">{{ mq.title }}</h4>
            <div v-if="mq.subQuestions.length > 0" class="ml-3 space-y-2">
              <div v-for="sq in mq.subQuestions" :key="sq.id" class="flex flex-col gap-1">
                <label :for="`tien-can-${sq.id}`" class="text-sm opacity-70">{{ sq.text }}</label>
                <input :id="`tien-can-${sq.id}`" v-model="tienCanAnswers[sq.id]" type="text" class="input-field" placeholder="Nhập câu trả lời..." />
              </div>
            </div>
            <p v-else class="ml-3 text-xs opacity-60 italic">Quan sát kỹ năng này trong quá trình hỏi bệnh.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- V. Khám lâm sàng -->
    <section class="card p-4">
      <h2 class="card-title">V. Khám lâm sàng</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Mạch (l/ph)</span>
          <input v-model="vitalSigns.heartRate" type="text" class="input-field" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">HA (mmHg)</span>
          <input v-model="vitalSigns.bloodPressure" type="text" class="input-field" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Nhiệt độ (°C)</span>
          <input v-model="vitalSigns.temperature" type="text" class="input-field" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">SpO2 (%)</span>
          <input v-model="vitalSigns.spo2" type="text" class="input-field" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Nhịp thở (l/ph)</span>
          <input v-model="vitalSigns.respiratoryRate" type="text" class="input-field" />
        </label>
      </div>
      <div class="space-y-3 mt-4">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Tổng trạng</span>
          <textarea v-model="examSystems.general" rows="2" class="input-field" placeholder="Tỉnh, tiếp xúc tốt..."></textarea>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Đầu mặt cổ</span>
          <textarea v-model="examSystems.headNeck" rows="2" class="input-field"></textarea>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Tim</span>
          <textarea v-model="examSystems.heart" rows="2" class="input-field"></textarea>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Phổi</span>
          <textarea v-model="examSystems.lungs" rows="2" class="input-field"></textarea>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Bụng</span>
          <textarea v-model="examSystems.abdomen" rows="2" class="input-field"></textarea>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Thần kinh - Cơ xương khớp</span>
          <textarea v-model="examSystems.neuroMuscular" rows="2" class="input-field"></textarea>
        </label>
      </div>
    </section>

    <!-- VI. Cận lâm sàng -->
    <section class="card p-4">
      <h2 class="card-title">VI. Cận lâm sàng</h2>
      <div class="overflow-x-auto mt-3">
        <table class="text-sm w-full border-collapse">
          <thead>
            <tr class="border-b border-stone-200 dark:border-stone-700">
              <th class="text-left p-1">Xét nghiệm</th>
              <th class="text-left p-1">Ngày</th>
              <th class="text-left p-1">Kết quả</th>
              <th class="text-left p-1">Đơn vị</th>
              <th class="text-left p-1">Tham chiếu</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(lab, idx) in labs" :key="idx" class="border-b border-stone-200/50 dark:border-stone-700/50">
              <td class="p-1"><input v-model="lab.testName" class="input-field w-full" placeholder="RBC" /></td>
              <td class="p-1"><input v-model="lab.date" type="date" class="input-field w-full" /></td>
              <td class="p-1"><input v-model="lab.result" class="input-field w-full" placeholder="3.95" /></td>
              <td class="p-1"><input v-model="lab.unit" class="input-field w-full" placeholder="T/L" /></td>
              <td class="p-1"><input v-model="lab.reference" class="input-field w-full" placeholder="3.8-5.5" /></td>
              <td class="p-1"><button @click="removeLab(idx)" v-if="labs.length > 1" class="text-red-500">Xoá</button></td>
            </tr>
          </tbody>
        </table>
        <button @click="addLab" class="mt-2 text-sm text-purple-600">+ Thêm xét nghiệm</button>
      </div>
    </section>

    <!-- VII. Chẩn đoán & Biện luận -->
    <section class="card p-4">
      <h2 class="card-title">VII. Chẩn đoán & Biện luận</h2>
      <div class="space-y-3 mt-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Chẩn đoán sơ bộ</span>
          <input v-model="workingDiagnosis" type="text" class="input-field" />
        </label>
        <div>
          <span class="text-xs font-medium opacity-60 mb-1 block">Chẩn đoán phân biệt</span>
          <div v-for="(d, idx) in differentials" :key="idx" class="flex items-center gap-2 mb-1">
            <input v-model="differentials[idx]" type="text" class="input-field flex-1" />
            <button @click="removeDifferential(idx)" v-if="differentials.length > 1" class="text-red-500 text-sm">Xoá</button>
          </div>
          <button @click="addDifferential" class="text-sm text-purple-600">+ Thêm chẩn đoán phân biệt</button>
        </div>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Chẩn đoán xác định</span>
          <input v-model="finalDiagnosis" type="text" class="input-field" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium opacity-60">Biện luận</span>
          <textarea v-model="reasoning" rows="5" class="input-field" placeholder="Lập luận lâm sàng..."></textarea>
        </label>
      </div>
    </section>

    <!-- Actions -->
    <div class="flex items-center gap-4">
      <button @click="handleSave" :disabled="saving" class="btn-primary">
        {{ saving ? 'Đang lưu…' : 'Lưu bệnh án' }}
      </button>
      <p v-if="saved" class="text-sm text-green-600">✅ Đã lưu thành công!</p>
      <p v-if="saveError" class="text-sm text-red-500">{{ saveError }}</p>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply bg-transparent border-b border-stone-800/20 dark:border-stone-100/20 outline-none focus:border-purple-500 px-1 py-1 text-sm;
}
.btn-primary {
  @apply px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50;
}
</style>