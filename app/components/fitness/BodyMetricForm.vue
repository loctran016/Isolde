<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRegle } from '@regle/core'
import { required, numeric, minValue, withMessage } from '@regle/rules'

const supabase = useSupabaseClient()
const open = ref(false)

interface BodyMetricRow {
  id: number
  weight: number
  height: number
  neck: number
  waist: number
  bf: number
  created_at: string
}

const form = ref<{
  weight: number | null
  height: number | null
  neck: number | null
  waist: number | null
}>({
  weight: null,
  height: null,
  neck: null,
  waist: null,
})

const { r$ } = useRegle(form, {
  weight: {
    required: withMessage(required, 'Enter your weight.'),
    numeric,
    minValue: minValue(1),
  },
  height: {
    required: withMessage(required, 'Enter your height.'),
    numeric,
    minValue: minValue(50),
  },
  neck: {
    required: withMessage(required, 'Enter your neck circumference.'),
    numeric,
    minValue: minValue(1),
  },
  waist: {
    required: withMessage(required, 'Enter your waist circumference.'),
    numeric,
    minValue: minValue(1),
    greaterThanNeck: withMessage(
      (value: number | null) => value == null || form.value.neck == null || value > form.value.neck,
      'Waist should be greater than neck for an accurate estimate.',
    ),
  },
})

// US Navy method (male formula) — metric, cm/kg. Requires height, neck, waist;
// the female variant additionally needs a hip measurement, not collected here.
const bodyFatPercent = computed(() => {
  const { height, neck, waist } = form.value
  if (!height || !neck || !waist || waist <= neck) return null
  const bf =
    495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450
  return Math.round(bf * 10) / 10
})

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const latestEntry = ref<BodyMetricRow | null>(null)
const hasFetchedLatest = ref(false)

async function fetchLatest() {
  if (hasFetchedLatest.value) return
  hasFetchedLatest.value = true

  const { data, error } = await supabase
    .from('body_metrics')
    .select('id, weight, height, neck, waist, bf, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Failed to load previous body metrics', error)
    return
  }
  latestEntry.value = data as BodyMetricRow | null
}

watch(open, async (v) => {
  if (!v) return
  errorMsg.value = ''
  successMsg.value = ''

  await fetchLatest()

  // Only prefill on first-ever open (form still empty) — don't clobber
  // in-progress edits if the user reopens after already typing something.
  if (latestEntry.value && form.value.weight == null) {
    form.value.weight = latestEntry.value.weight
    form.value.height = latestEntry.value.height
    form.value.neck = latestEntry.value.neck
    form.value.waist = latestEntry.value.waist
  }
})

async function onSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  const { valid, data } = await r$.$validate()
  if (!valid) return

  const bf = bodyFatPercent.value
  if (bf == null) {
    errorMsg.value = 'Could not calculate body fat — check your waist and neck values.'
    return
  }

  // Skip saving a duplicate entry if nothing has actually changed
  const unchanged =
    latestEntry.value != null &&
    data.weight === latestEntry.value.weight &&
    data.height === latestEntry.value.height &&
    data.neck === latestEntry.value.neck &&
    data.waist === latestEntry.value.waist

  if (unchanged) {
    successMsg.value = 'No changes from your last entry — nothing new to save.'
    setTimeout(() => (open.value = false), 900)
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.from('body_metrics').insert({
      weight: data.weight,
      height: data.height,
      neck: data.neck,
      waist: data.waist,
      bf,
    })

    if (error) throw error

    latestEntry.value = {
      id: -1,
      weight: data.weight as number,
      height: data.height as number,
      neck: data.neck as number,
      waist: data.waist as number,
      bf,
      created_at: new Date().toISOString(),
    }

    await refreshNuxtData('body-metrics-history')
    successMsg.value = 'Body metrics saved.'
    setTimeout(() => (open.value = false), 900)
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Failed to save body metrics.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <FormWrapper v-model:open="open" title="Body Metrics">
    <template #trigger>
      <slot />
    </template>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block text-sm font-medium">Weight (kg)</label>
          <input
            v-model.number="form.weight"
            type="number"
            inputmode="numeric"
            min="0"
            step="0.1"
            class="w-full focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
          />
          <p v-if="r$.weight.$error" class="text-xs text-red-600 dark:text-red-400 mt-1">
            {{ r$.weight.$errors[0] }}
          </p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Height (cm)</label>
          <input
            v-model.number="form.height"
            type="number"
            inputmode="numeric"
            min="0"
            step="0.1"
            class="w-full focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
          />
          <p v-if="r$.height.$error" class="text-xs text-red-600 dark:text-red-400 mt-1">
            {{ r$.height.$errors[0] }}
          </p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Neck (cm)</label>
          <input
            v-model.number="form.neck"
            type="number"
            inputmode="numeric"
            min="0"
            step="0.1"
            class="w-full focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
          />
          <p v-if="r$.neck.$error" class="text-xs text-red-600 dark:text-red-400 mt-1">
            {{ r$.neck.$errors[0] }}
          </p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Waist (cm)</label>
          <input
            v-model.number="form.waist"
            type="number"
            inputmode="numeric"
            min="0"
            step="0.1"
            class="w-full focus:outline-none border-b-gray-500/30 dark:border-b-gray-100/50 focus:border-purple-600 transition-all duration-200 border px-3 py-2 border-0 border-b-2"
          />
          <p v-if="r$.waist.$error" class="text-xs text-red-600 dark:text-red-400 mt-1">
            {{ r$.waist.$errors[0] }}
          </p>
        </div>
      </div>

      <div
        v-if="bodyFatPercent != null"
        class="rounded-lg bg-purple-400/15 dark:bg-purple-500/15 px-4 py-3 flex items-center justify-between"
      >
        <span class="text-sm font-medium">Estimated body fat</span>
        <span class="text-lg font-semibold text-purple-700 dark:text-purple-300"
          >{{ bodyFatPercent }}%</span
        >
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400 bg-red-950/60">
        {{ errorMsg }}
      </p>
      <p v-if="successMsg" class="text-sm text-emerald-600 dark:text-emerald-400">
        {{ successMsg }}
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="flex ml-auto px-3 py-3 mt-6 hover:scale-101 hover:-translate-y-0.5 hover:shadow-lg items-center justify-center border-1 border-stone-700/90 dark:border-stone-100/50 hover:dark:border-stone-100/80 transition-all duration-200 rounded-md px-[15px] leading-none focus:shadow-[0_0_0_2px] focus:outline-none cursor-pointer disabled:opacity-60"
      >
        {{ loading ? 'Saving...' : 'Save metrics' }}
      </button>
    </form>
  </FormWrapper>
</template>
