<script setup lang="ts">
import { ref, computed } from 'vue'

// --- Meta & Island (optional, keep your existing island system) ---
useHead({
  title: 'Bảng kiểm Tiêu phân đen – Medic Island',
  meta: [{ name: 'description', content: 'Practice history-taking for melena' }],
})
definePageMeta({ title: 'Medic Island', titleIcon: 'i-mdi:clipboard-check' })

// --- Checklist data (hierarchical) ---
const sections = [
  {
    title: 'HỎI BỆNH SỬ',
    mainQuestions: [
      {
        id: 'h7',
        title: 'Có thực sự là tiêu phân đen',
        subQuestions: [
          { id: 'h7a', text: 'Có sử dụng thực phẩm: tiết canh, thức ăn màu đỏ?' },
          { id: 'h7b', text: 'Có dùng thuốc trị dạ dày (Bismuth), thực phẩm bổ sung sắt?' },
          { id: 'h7c', text: 'Chấn thương? Dập nát cơ?' },
        ],
      },
      {
        id: 'h8',
        title: 'Tính chất tiêu phân đen',
        subQuestions: [
          { id: 'h8a', text: 'Hoàn cảnh khởi phát? Cách đây bao lâu?' },
          { id: 'h8b', text: 'Lượng? Số lần?' },
          { id: 'h8c', text: 'Màu sắc? (Đen toàn bãi? Lẫn vàng?)' },
          { id: 'h8d', text: 'Kèm nhầy? Máu đỏ? Bóng?' },
          { id: 'h8e', text: 'Mùi? (hôi, tanh)' },
          { id: 'h8f', text: 'Lỏng / đặc / sệt' },
          { id: 'h8g', text: 'Tăng/giảm (độ lỏng, số lần, lượng)' },
        ],
      },
      {
        id: 'h9',
        title: 'Triệu chứng kèm theo',
        subQuestions: [
          { id: 'h9a', text: 'Lạnh run, vã mồ hôi, khát nước' },
          { id: 'h9b', text: 'Chóng mặt, choáng váng, ngất' },
          { id: 'h9c', text: 'Nước tiểu (đánh giá biến chứng suy thận cấp)' },
          { id: 'h9d', text: 'Nôn, nôn ra máu (khai thác đầy đủ tính chất nôn ra máu)' },
          { id: 'h9e', text: 'Đau bụng (thượng vị, …)' },
          { id: 'h9f', text: 'Mệt mỏi, chán ăn, sụt cân?' },
          { id: 'h9g', text: 'Ợ hơi, ợ chua' },
        ],
      },
    ],
  },
  {
    title: 'TIỀN CĂN',
    mainQuestions: [
      {
        id: 't10',
        title: 'Tiền căn tiêu phân đen? Giống lần này? (đi khám và chẩn đoán gì?)',
        subQuestions: [
          { id: 't10a', text: 'Mô tả' },
        ],
      },
      {
        id: 't11',
        title: 'Bệnh lý nội khoa',
        subQuestions: [
          { id: 't11a', text: 'Tiền căn nội soi tiêu hoá' },
          { id: 't11b', text: 'Bệnh lý đường tiêu hoá: trào ngược dạ dày thực quản (nuốt khó, ợ nóng, ợ chua, buồn nôn), nhiễm Hp, trĩ' },
          { id: 't11c', text: 'Viêm gan siêu vi, chích ngừa viêm gan, xơ gan, ung thư' },
          { id: 't11d', text: 'Bệnh lý khác: Đái tháo đường, THA, bệnh tim mạch, huyết học' },
        ],
      },
      {
        id: 't12',
        title: 'Bệnh lý ngoại khoa: Phẫu thuật? Sản khoa - PARA',
        subQuestions: [
          { id: 't12a', text: 'Mô tả' },
        ],
      },
    ],
  },
]

// --- Patient info ---
const patientName = ref('')
const dob = ref('') // ISO date string
const occupation = ref('')
const address = ref('')
const ward = ref('')

// --- Answers state ---
const answers = ref<Record<string, string>>({})
// Initialize all sub-questions with empty strings
for (const section of sections) {
  for (const mq of section.mainQuestions) {
    for (const sq of mq.subQuestions) {
      answers.value[sq.id] = ''
    }
  }
}

// --- Auto‑calculate age from DOB ---
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
  // Basic validation
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
      answers: JSON.parse(JSON.stringify(answers.value)), // ensure plain object
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
  for (const key of Object.keys(answers.value)) {
    answers.value[key] = ''
  }
  saved.value = false
  saveError.value = null
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-6 font-sans dark:text-gray-100">
    <h1 class="text-xl font-bold mb-6">
      BẢNG KIỂM KỸ NĂNG HỎI BỆNH SỬ TIÊU PHÂN ĐEN
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

    <!-- Questions -->
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

          <div class="ml-4 space-y-3">
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