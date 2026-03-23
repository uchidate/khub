import { create } from 'zustand'

interface QuickSearchState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useQuickSearch = create<QuickSearchState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
