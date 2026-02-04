'use client'

import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    set((state: ToastStore) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))

    // Auto-remove after duration
    setTimeout(() => {
      set((state: ToastStore) => ({
        toasts: state.toasts.filter((t: Toast) => t.id !== id)
      }))
    }, toast.duration || 5000)
  },
  removeToast: (id: string) => {
    set((state: ToastStore) => ({
      toasts: state.toasts.filter((t: Toast) => t.id !== id)
    }))
  }
}))
