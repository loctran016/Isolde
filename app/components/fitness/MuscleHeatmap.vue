<script setup lang="ts">
import bodyFrontRaw from '~/assets/svg/body-front.svg?raw'
import bodyBackRaw from '~/assets/svg/body-back.svg?raw'
import { parseDateTime, today } from '@internationalized/date'
import type { MuscleGroup, StrengthRecord } from '~/types/database.types'

const props = withDefaults(defineProps<{ days?: number; strengthExercises: StrengthRecord[] }>(), {
  days: 30,
})

const emit = defineEmits<{ select: [groups: MuscleGroup[]] }>()

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

const MUSCLE_MAP: Record<MuscleGroup, { front?: string[]; back?: string[] }> = {
  'Upper chest': { front: ['pectoralis_minor'] },
  'Middle chest': { front: ['pectoralis_major'] },
  'Lower chest': { front: ['pectoralis_major'] },
  'Front delts': { front: ['deltoid_anterior_head'] },
  'Side delts': { front: ['deltoid_middle_head'], back: ['deltoid_middle_head'] },
  'Rear delts': { back: ['deltoid_posterior_head'] },
  Abs: {
    front: [
      'rectus_abdominis',
      'tendinous_inscriptions_upper',
      'tendinous_inscriptions_middle',
      'tendinous_inscriptions_lower',
      'obliques_upper',
      'obliques_lower',
    ],
  },
  Lats: { back: ['latissimus_dorsi'] },
  Traps: { front: ['trapezius'], back: ['trapezius_upper', 'trapezius'] },
  'Lower back': { back: ['erector_spinae'] },
  Forearm: {
    front: ['brachioradialis', 'flexor_carpi_ulnaris', 'extensor_carpi_ulnaris'],
    back: ['brachioradialis', 'flexor_carpi_ulnaris', 'extensor_carpi_ulnaris'],
  },
  Triceps: { back: ['triceps_brachii_lateral_long', 'triceps_brachii_medial'] },
  Biceps: { front: ['biceps_brachii_long_head', 'biceps_brachii_short_head'] },
}

// Reverse lookup: a path id like "pectoralis_major" maps back to every
// MuscleGroup that shares it (Middle chest AND Lower chest).
const PATH_TO_GROUPS = computed(() => {
  const map: Record<string, MuscleGroup[]> = {}
  for (const [group, sides] of Object.entries(MUSCLE_MAP) as [
    MuscleGroup,
    { front?: string[]; back?: string[] },
  ][]) {
    for (const id of [...(sides.front ?? []), ...(sides.back ?? [])]) {
      if (!map[id]) map[id] = []
      map[id].push(group)
    }
  }
  return map
})

function setsLoggedForMuscle(group: MuscleGroup, cutoff: ReturnType<typeof today>) {
  let total = 0
  for (const item of props.strengthExercises) {
    if (!item?.date || !item.muscles?.includes(group)) continue
    const d = parseDateTime(item.date)
    if (d.compare(cutoff) < 0) continue
    total += item.sets?.length ?? 0
  }
  return total
}

const volumeByPathId = computed(() => {
  const cutoff = today(TIME_ZONE).subtract({ days: props.days })
  const totals: Record<string, number> = {}
  for (const [group, sides] of Object.entries(MUSCLE_MAP) as [
    MuscleGroup,
    { front?: string[]; back?: string[] },
  ][]) {
    const groupSets = setsLoggedForMuscle(group, cutoff)
    if (groupSets === 0) continue
    for (const id of [...(sides.front ?? []), ...(sides.back ?? [])]) {
      totals[id] = (totals[id] ?? 0) + groupSets
    }
  }
  return totals
})

const maxPathVolume = computed(() => Math.max(1, ...Object.values(volumeByPathId.value)))
const selectedPathId = ref<string | null>(null)

function colorForVolume(volume: number) {
  if (volume === 0) return null
  const t = Math.min(1, volume / maxPathVolume.value)
  const alpha = 0.18 + t * 0.5
  return `rgba(168, 85, 247, ${alpha.toFixed(2)})`
}

const frontRef = ref<HTMLDivElement | null>(null)
const backRef = ref<HTMLDivElement | null>(null)
const isMounted = ref(false)

function handlePathClick(id: string) {
  const groups = PATH_TO_GROUPS.value[id]
  if (!groups) return
  selectedPathId.value = id
  emit('select', groups)
}

function paint(container: HTMLDivElement | null, side: 'front' | 'back') {
  if (!container) return
  const idsForSide = new Set<string>()
  for (const sides of Object.values(MUSCLE_MAP)) {
    for (const id of sides[side] ?? []) idsForSide.add(id)
  }
  for (const id of idsForSide) {
    const el = container.querySelector<SVGPathElement>(`#${id}`)
    if (!el) continue

    const color = colorForVolume(volumeByPathId.value[id] ?? 0)
    if (color) el.style.fill = color
    else el.style.removeProperty('fill')

    el.style.stroke = id === selectedPathId.value ? '#a855f7' : 'transparent'
    el.style.strokeWidth = id === selectedPathId.value ? '1.5' : '0'

    // avoid stacking duplicate listeners on repeated repaint() calls
    el.removeEventListener('click', (el as any)._muscleClickHandler)
    const handler = () => handlePathClick(id)
    ;(el as any)._muscleClickHandler = handler
    el.addEventListener('click', handler)
  }
}

function repaint() {
  paint(frontRef.value, 'front')
  paint(backRef.value, 'back')
}

onMounted(() => {
  isMounted.value = true
  nextTick(repaint)
})

watch(volumeByPathId, () => nextTick(repaint))
watch(selectedPathId, () => nextTick(repaint))
</script>

<template>
  <div v-if="isMounted" class="grid grid-cols-2 gap-4 place-items-center">
    <div ref="frontRef" class="body-map w-full max-w-40" v-html="bodyFrontRaw" />
    <div ref="backRef" class="body-map w-full max-w-40" v-html="bodyBackRaw" />
  </div>
  <div v-else class="h-64 flex items-center justify-center text-sm text-stone-500">Loading…</div>
</template>

<style scoped>
.body-map :deep(path) {
  fill: rgba(41, 37, 36, 0.22);
  transition:
    fill 200ms ease,
    stroke 200ms ease;
  cursor: pointer;
}

html.dark .body-map :deep(path) {
  fill: rgba(255, 255, 255, 0.22);
}
</style>
