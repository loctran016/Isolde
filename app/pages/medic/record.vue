<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { checklists } from '~/data/medic'

// ---------- Checklist data & symptom vocabulary ----------
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

// Get all sub‑questions from the selected checklist to serve as symptom vocabulary
const symptomVocabulary = computed(() => {
  const raw = checklists[selectedChecklistKey.value] ?? []
  const items: { id: string; text: string }[] = []
  for (const section of raw) {
    for (const mq of section.mainQuestions) {
      for (const sq of mq.subQuestions) {
        // Only include sub‑questions that are actual symptoms (skip "Mô tả" or very generic ones)
        if (sq.text !== 'Mô tả') {
          items.push({ id: sq.id, text: sq.text })
        }
      }
    }
  }
  return items
})

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

// ---------- Timeline events ----------
interface TimelineEvent {
  id: string
  timeLabel: string
  narrative: string
  symptomIds: string[]
}
let eventCounter = 0
const timeline = ref<TimelineEvent[]>([{ id: `ev${++eventCounter}`, timeLabel: '', narrative: '', symptomIds: [] }])

function addEvent() {
  timeline.value.push({ id: `ev${++eventCounter}`, timeLabel: '', narrative: '', symptomIds: [] })
}
function removeEvent(index: number) {
  if (timeline.value.length > 1) timeline.value.splice(index, 1)
}

// Symptom picker within an event (open by clicking a button)
const symptomSearch = ref('')
const activeEventIndex = ref<number | null>(null)
const filteredSymptoms = computed(() => {
  const q = symptomSearch.value.toLowerCase().trim()
  if (!q) return symptomVocabulary.value
  return symptomVocabulary.value.filter(s => s.text.toLowerCase().includes(q))
})

function openSymptomPicker(eventIdx: number) {
  activeEventIndex.value = eventIdx
  symptomSearch.value = ''
}
function closeSymptomPicker() {
  activeEventIndex.value = null
  symptomSearch.value = ''
}
function toggleSymptom(symptomId: string) {
  if (activeEventIndex.value === null) return
  const ev = timeline.value[activeEventIndex.value]
  const idx = ev.symptomIds.indexOf(symptomId)
  if (idx === -1) ev.symptomIds.push(symptomId)
  else ev.symptomIds.splice(idx, 1)
}
function isSelected(symptomId: string) {
  if (activeEventIndex.value === null) return false
  return timeline.value[activeEventIndex.value].symptomIds.includes(symptomId)
}

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
    physical_exam: {
      vitalSigns: JSON.parse(JSON.stringify(vitalSigns.value)),
      systems: JSON.parse(JSON.stringify(examSystems.value)),
    },
    review_of_systems: {}, // placeholder for future
    lab_results: JSON.parse(JSON.stringify(labs.value.filter(l => l.testName.trim() !== ''))),
    diagnosis: {
      working: workingDiagnosis.value,
      differentials: differentials.value.filter(d => d.trim() !== ''),
      final: finalDiagnosis.value,
    },
    reasoning: reasoning.value,
    summary: '', // can be auto-generated later
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

    <!-- Hành chính -->
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

    <!-- Lý do nhập viện -->
    <section class="card p-4">
      <h2 class="card-title">II. Lý do nhập viện</h2>
      <div class="flex items-center gap-3 mt-3">
        <span class="text-sm opacity-80">Lí do:</span>
        <Select v-model="reasonDisplay" :options="Object.keys(displayNameByKey).map(k => displayNameByKey[k])" class="w-64" />
      </div>
    </section>

    <!-- Bệnh sử & Tiền căn (Timeline) -->
    <section class="card p-4">
      <h2 class="card-title">III. Bệnh sử & Tiền căn (Timeline)</h2>
      <div class="space-y-4 mt-3">
        <div v-for="(ev, idx) in timeline" :key="ev.id" class="border border-stone-200 dark:border-stone-700 rounded-lg p-3">
          <div class="flex items-start justify-between gap-2">
            <input v-model="ev.timeLabel" type="text" class="input-field flex-1" placeholder="CNV 19 giờ..." />
            <button v-if="timeline.length > 1" @click="removeEvent(idx)" class="text-red-500 hover:text-red-700 text-sm">Xoá</button>
          </div>
          <textarea v-model="ev.narrative" rows="3" class="input-field mt-2 w-full" placeholder="Diễn biến..."></textarea>
          <!-- Symptoms -->
          <div class="mt-2 flex flex-wrap gap-1">
            <span v-for="sid in ev.symptomIds" :key="sid" class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs px-2 py-0.5 rounded-full">
              {{ symptomVocabulary.find(s => s.id === sid)?.text || sid }}
            </span>
            <button @click="openSymptomPicker(idx)" class="text-xs text-purple-600 hover:underline">+ Thêm triệu chứng</button>
          </div>
          <!-- Symptom picker popup -->
          <div v-if="activeEventIndex === idx" class="mt-2 p-2 bg-white dark:bg-stone-800 border rounded shadow">
            <input v-model="symptomSearch" type="text" class="input-field mb-2 w-full" placeholder="Tìm triệu chứng..." />
            <div class="max-h-40 overflow-y-auto space-y-1">
              <label v-for="s in filteredSymptoms" :key="s.id" class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" :checked="isSelected(s.id)" @change="toggleSymptom(s.id)" class="accent-purple-500" />
                {{ s.text }}
              </label>
            </div>
            <button @click="closeSymptomPicker" class="mt-2 text-xs text-purple-600">Đóng</button>
          </div>
        </div>
        <button @click="addEvent" class="text-sm text-purple-600 hover:underline">+ Thêm mốc thời gian</button>
      </div>
    </section>

    <!-- Khám lâm sàng -->
    <section class="card p-4">
      <h2 class="card-title">IV. Khám lâm sàng</h2>
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

    <!-- Cận lâm sàng -->
    <section class="card p-4">
      <h2 class="card-title">V. Cận lâm sàng</h2>
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

    <!-- Chẩn đoán & Biện luận -->
    <section class="card p-4">
      <h2 class="card-title">VI. Chẩn đoán & Biện luận</h2>
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