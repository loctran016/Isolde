// app/data/meditationPractices.ts
export interface MeditationPractice {
  key: string
  label: string
  unit: string
  firstValue: number
  stepValue: number
}

export const MEDITATION_PRACTICES: MeditationPractice[] = [
  { key: 'tara', label: 'Tara', unit: 'Tràng', firstValue: 13, stepValue: 1 },
  { key: 'tri_tung_21_tara', label: 'Trì tụng 21 Tara', unit: 'Lần', firstValue: 3, stepValue: 1 },
  { key: 'lay_dai', label: 'Lạy dài', unit: 'Lần', firstValue: 21, stepValue: 21 },
  { key: 'van_thu_su_loi', label: 'Văn Thù Sư Lợi', unit: 'Tràng', firstValue: 1, stepValue: 1 },
  { key: 'lien_hoa_sinh', label: 'Liên Hoa Sinh', unit: 'Tràng', firstValue: 1, stepValue: 1 },
  { key: 'kim_cang_tat_doa', label: 'Kim Cang Tát Đỏa', unit: 'Lần', firstValue: 1, stepValue: 1 },
  { key: 'bat_nha_tam_kinh', label: 'Bát nhã Tâm Kinh', unit: 'Biến', firstValue: 1, stepValue: 1 },
  {
    key: 'cau_nguyen_7_dong',
    label: 'Cầu nguyện 7 dòng',
    unit: 'Biến',
    firstValue: 3,
    stepValue: 1,
  },
  {
    key: 'phat_dinh_ton_thang',
    label: 'Namgyalma',
    unit: 'Lần',
    firstValue: 1,
    stepValue: 1,
  },
  {
    key: 'lien_hoa_sinh_truong_tho',
    label: 'LHS Trường Thọ',
    unit: 'Tràng',
    firstValue: 1,
    stepValue: 1,
  },
  { key: 'thien_tue', label: 'Thiền Tuệ (đề mục)', unit: 'Phút', firstValue: 1, stepValue: 1 },
  { key: 'dechen_monlam', label: 'Dechen Monlam', unit: 'Biến', firstValue: 3, stepValue: 1 },
  { key: 'tam_ton_phan_no', label: 'Tam Tôn Phẫn Nộ', unit: 'Biến', firstValue: 7, stepValue: 1 },
  { key: 'kalachakra', label: 'Kalachakra', unit: 'Biến', firstValue: 7, stepValue: 1 },
  { key: 'quan_am', label: 'Quan Âm', unit: 'Tràng', firstValue: 1, stepValue: 1 },
  { key: 'dzambhala', label: 'Dzambhala', unit: 'Tràng', firstValue: 1, stepValue: 1 },
]
