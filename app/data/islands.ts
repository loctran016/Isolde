export interface Island {
  key: string
  path: string
  navLabel: string // short label used in NavBar
  pageTitle: string // e.g. "Body Island" — shown in the header
  titleIcon: string // UnoCSS icon class
  description: string // for useHead meta description
}

export const ISLANDS: Island[] = [
  {
    key: 'home',
    path: '/',
    navLabel: 'Home',
    pageTitle: 'Home Island',
    titleIcon: 'i-mdi:home',
    description: "Your day at a glance — calendar, to-do list, and what's coming up next.",
  },
  {
    key: 'fitness',
    path: '/fitness',
    navLabel: 'Fitness',
    pageTitle: 'Body Island',
    titleIcon: 'i-mdi:weight-lifter',
    description: 'Activity and metric logs.',
  },
  {
    key: 'musical',
    path: '/musical',
    navLabel: 'Musical',
    pageTitle: 'Sound Island',
    titleIcon: 'i-mdi:music-clef-treble',
    description: 'Sheet music, rendered live, with a built-in metronome.',
  },
  {
    key: 'gallery',
    path: '/gallery',
    navLabel: 'Gallery',
    pageTitle: 'Light Island',
    titleIcon: 'i-solar:gallery-round-bold',
    description: 'Every photo, organized by folder and tag.',
  },
  {
    key: 'habit',
    path: '/habit',
    navLabel: 'Habits',
    pageTitle: 'Habit Island',
    titleIcon: 'i-solar:star-rainbow-bold',
    description: 'Skincare, walks, and weekly habits, tracked.',
  },
  {
    key: 'meditate',
    path: '/meditate',
    navLabel: 'Meditate',
    pageTitle: 'Jewels Island',
    titleIcon: 'i-solar:hand-stars-bold',
    description: 'Daily practice counts, logged with a tap.',
  },
  {
    key: 'medic',
    path: '/medic',
    navLabel: 'Medic Island',
    pageTitle: 'Medic Island',
    titleIcon: 'i-solar:document-medicine-bold',
    description: 'Medical record editor.',
  },
  //   definePageMeta({ title: 'Medic Island', titleIcon: '' })
]

// Convenience lookup, so a page can grab its own entry by path
// without re-typing the key: ISLANDS.find(i => i.path === '/fitness')
export function getIsland(path: string): Island | undefined {
  return ISLANDS.find((i) => i.path === path)
}
