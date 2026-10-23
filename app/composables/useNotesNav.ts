// composables/useNotesNav.ts
export function useNotesNav() {
  return useAsyncData('notes-nav', () => clientContent.navigation())
}
