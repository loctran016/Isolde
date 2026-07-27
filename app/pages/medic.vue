<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { checklists } from '~/data/medic'

definePageMeta({ title: 'Medic Island', titleIcon: 'i-solar:document-medicine-bold' })

// --- Friendly names for the checklist keys ---
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

// Reverse mapping for easy key lookup
const displayNameToKey = Object.fromEntries(
  Object.entries(displayNameByKey).map(([key, label]) => [label, key])
)

// --- Reason‑for‑visit select ---
const reasonDisplay = ref('Tiêu phân đen') // default display name
const reasonOptions = Object.values(displayNameByKey) // array of friendly names

// When the display name changes, update the actual checklist key
const selectedChecklistKey = ref('tieu-phan-den')
watch(reasonDisplay, (newDisplay) => {
  const key = displayNameToKey[newDisplay]
  if (key) selectedChecklistKey.value = key
})

// --- Checklist sections (hide "KỸ NĂNG GIAO TIẾP") ---
const sections = computed(() => {
  const raw = checklists[selectedChecklistKey.value] ?? []
  return raw.filter(section => section.title !== 'KỸ NĂNG GIAO TIẾP')
})

// --- Patient info ---
const patientName = ref('')
const dob = ref('')
const occupation = ref('')
const address = ref('')
const ward = ref('')

// --- Answers state ---
const answers = ref<Record<string, string>>({})

// When the checklist changes, re‑initialize answers
watch(selectedChecklistKey, () => {
  const newAnswers: Record<string, string> = {}
  for (const section of sections.value) {
    for (const mq of section.mainQuestions) {
      for (const sq of mq.subQuestions) {
        newAnswers[sq.id] = ''
      }
    }
  }
  answers.value = newAnswers
}, { immediate: true })

// --- Auto‑calculate age ---
const age = computed(() => {
  if (!dob.value) return ''
  const birth = new Date(dob.value)
  const today = new Date()
  let ageYears = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    ageYears--
  }
  return ageYears > 0 ? `${ageYears} tuổi` : ''
})

// --- Saving ---
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

  try {
    const { error } = await supabase.from('medic_practice').insert({
      patient_name: patientName.value.trim(),
      dob: dob.value,
      occupation: occupation.value.trim(),
      address: address.value.trim(),
      ward: ward.value.trim(),
      answers: JSON.parse(JSON.stringify(answers.value)),
    })

    if (error) throw error
    saved.value = true
  } catch (e: any) {
    saveError.value = e.message || 'Lỗi khi lưu dữ liệu'
  } finally {
    saving.value = false
  }
}

function resetForm() {
  patientName.value = ''
  dob.value = ''
  occupation.value = ''
  address.value = ''
  ward.value = ''
  const newAnswers: Record<string, string> = {}
  for (const section of sections.value) {
    for (const mq of section.mainQuestions) {
      for (const sq of mq.subQuestions) {
        newAnswers[sq.id] = ''
      }
    }
  }
  answers.value = newAnswers
  saved.value = false
  saveError.value = null
}
</script>

<template>
  <div class="mx-auto my-2 grid grid-cols-1  gap-3 p-3 sm:gap-4 sm:px-4 sm:py-4 mx-auto font-sans dark:text-gray-100 max-w-4xl dark:text-gray-100">
    <h1 class="text-xl font-bold mb-6">
      BẢNG KIỂM KỸ NĂNG HỎI BỆNH SỬ
    </h1>

    <!-- Patient info card -->
    <div class="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium opacity-60">Họ và tên</span>
        <input
          v-model="patientName"
          type="text"
          class="bg-transparent border-b border-stone-800/20 dark:border-stone-100/20 outline-none focus:border-purple-500 px-1 py-1 text-sm"
          placeholder="Nhập họ tên bệnh nhân"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium opacity-60">Ngày tháng năm sinh</span>
        <input
          v-model="dob"
          type="date"
          class="bg-transparent border-b border-stone-800/20 dark:border-stone-100/20 outline-none focus:border-purple-500 px-1 py-1 text-sm"
        />
      </label>

      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium opacity-60">Tuổi</span>
        <span class="text-sm py-1 opacity-80">{{ age || '—' }}</span>
      </div>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium opacity-60">Nghề nghiệp</span>
        <input
          v-model="occupation"
          type="text"
          class="bg-transparent border-b border-stone-800/20 dark:border-stone-100/20 outline-none focus:border-purple-500 px-1 py-1 text-sm"
          placeholder="Nhập nghề nghiệp"
        />
      </label>

      <label class="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
        <span class="text-xs font-medium opacity-60">Địa chỉ</span>
        <input
          v-model="address"
          type="text"
          class="bg-transparent border-b border-stone-800/20 dark:border-stone-100/20 outline-none focus:border-purple-500 px-1 py-1 text-sm"
          placeholder="Nhập địa chỉ"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium opacity-60">Nằm viện tại</span>
        <input
          v-model="ward"
          type="text"
          class="bg-transparent border-b border-stone-800/20 dark:border-stone-100/20 outline-none focus:border-purple-500 px-1 py-1 text-sm"
          placeholder="Khoa / Phòng / Giường"
        />
      </label>
    </div>

    <!-- Reason for visit / admission -->
    <div class="card p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <span class="text-sm font-medium opacity-80">
          Lí do đến khám / nhập viện <span class="opacity-50">(Triệu chứng cơ năng khiến BN lo lắng nhất)</span>
        </span>
        <Select
          v-model="reasonDisplay"
          :options="reasonOptions"
          class="sm:w-64"
        />
      </div>
    </div>

    <!-- Questions (dynamic per selected checklist) -->
    <div class="space-y-6">
      <section
        v-for="section in sections"
        :key="section.title"
        class="card p-4"
      >
        <h2 class="text-base font-semibold mb-4 text-purple-600 dark:text-purple-400">
          {{ section.title }}
        </h2>

        <div
          v-for="mq in section.mainQuestions"
          :key="mq.id || mq.title"
          class="mb-6"
        >
          <h3 class="text-sm font-semibold mb-2 opacity-90">
            {{ mq.title }}
          </h3>

          <!-- Sub‑questions with text inputs -->
          <div
            v-if="mq.subQuestions.length > 0"
            class="ml-4 space-y-3"
          >
            <div
              v-for="sq in mq.subQuestions"
              :key="sq.id"
              class="flex flex-col gap-1"
            >
              <label
                :for="`q-${sq.id}`"
                class="text-sm opacity-70"
              >
                {{ sq.text }}
              </label>
              <input
                :id="`q-${sq.id}`"
                v-model="answers[sq.id]"
                type="text"
                class="bg-transparent border-b border-stone-800/20 dark:border-stone-100/20 outline-none focus:border-purple-500 px-1 py-1 text-sm"
                placeholder="Nhập câu trả lời..."
              />
            </div>
          </div>

          <!-- Main questions with no sub‑questions: skill observation -->
          <p
            v-else
            class="ml-4 text-sm opacity-60 italic"
          >
            Quan sát kỹ năng này trong quá trình hỏi bệnh.
          </p>
        </div>
      </section>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-4 mt-6">
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
        :disabled="saving"
        @click="handleSave"
      >
        {{ saving ? 'Đang lưu…' : 'Lưu' }}
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-lg border border-stone-800/20 dark:border-stone-100/20 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        @click="resetForm"
      >
        Làm mới
      </button>

      <p
        v-if="saved"
        class="text-sm text-green-600 dark:text-green-400"
      >
        ✅ Đã lưu thành công!
      </p>

      <p
        v-if="saveError"
        class="text-sm text-red-500"
      >
        {{ saveError }}
      </p>
    </div>
  </div>
</template>