type ThemePref = 'light' | 'dark' | 'system'

export const useTheme = () => {
  // export function useTheme() {
  const themePref = useCookie<ThemePref>('theme-preference', { default: () => 'system' })

  const applyTheme = () => {
    if (!import.meta.client) return
    const prefersDark =
      themePref.value === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : themePref.value === 'dark'
    document.documentElement.classList.toggle('dark', prefersDark)
  }

  function cycleTheme() {
    if (themePref.value === 'system') themePref.value = 'dark'
    else if (themePref.value === 'dark') themePref.value = 'light'
    else themePref.value = 'system'
  }

  return { themePref, applyTheme, cycleTheme }
}
