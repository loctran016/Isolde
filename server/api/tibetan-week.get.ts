import { TibetanDate } from 'tibetan-date-calculator'

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

// Recurring monthly practice days, keyed by Tibetan day-of-month (1–30)
const RECURRING: Record<number, string> = {
  8: 'Medicine Buddha Day',
  10: 'Guru Rinpoche Day',
  15: 'Full Moon — Amitābha Day',
  25: 'Dakini Day',
  29: 'Dharma Protector Day',
  30: 'New Moon — Buddha Day',
}

// Annual festivals, keyed by "tibetanMonth-tibetanDay" — verify against a trusted source
const ANNUAL: Record<string, string> = {
  '1-1': 'Losar (Tibetan New Year)',
  '1-15': 'Chötrul Düchen',
  '3-15': 'Duekhor Düchen (Kalachakra Day)',
  '4-4': 'Chökhor Düchen',
  '4-15': 'Saga Dawa Düchen',
  '9-22': 'Lhabab Düchen',
  '10-25': 'Ganden Ngamchö (Tsongkhapa Day)',
}

export interface TibetanHolyDay {
  westernDate: string
  tibetanMonth: number
  tibetanDay: number
  label: string
  isAnnual: boolean
}

export default defineEventHandler((): TibetanHolyDay[] => {
  const results: TibetanHolyDay[] = []

  // Ngày hôm nay theo giờ Việt Nam (en-CA cho định dạng YYYY-MM-DD)
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date())
  const [y, m, day] = todayStr.split('-').map(Number)

  for (let i = 0; i < 7; i++) {
    // Lấy 12:00 trưa để không bị lệch ngày do múi giờ
    const d = new Date(y, m - 1, day + i, 12)

    const tib = new TibetanDate(d)
    if (tib.isSkippedDay) continue

    const annualKey = `${tib.month}-${tib.date}`
    const annualLabel = ANNUAL[annualKey]
    const label = annualLabel ?? RECURRING[tib.date]

    if (label) {
      results.push({
        westernDate: tib.westernDateStr,
        tibetanMonth: tib.month,
        tibetanDay: tib.date,
        label,
        isAnnual: Boolean(annualLabel),
      })
    }
  }

  return results
})