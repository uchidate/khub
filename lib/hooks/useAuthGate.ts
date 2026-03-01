import { create } from 'zustand'

interface AuthGateState {
  isOpen: boolean
  action: string
  open: (action: string) => void
  close: () => void
}

export const useAuthGate = create<AuthGateState>((set) => ({
  isOpen: false,
  action: '',
  open: (action) => set({ isOpen: true, action }),
  close: () => set({ isOpen: false }),
}))
