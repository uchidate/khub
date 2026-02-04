'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme()

  // Prevent flash of wrong icon during SSR
  if (!isLoaded) {
    return (
      <button className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors">
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-zinc-400 hover:text-white transition-all hover:bg-zinc-800/50"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 transition-transform hover:rotate-180 duration-500" />
      ) : (
        <Moon className="w-5 h-5 transition-transform hover:-rotate-12 duration-300" />
      )}
    </button>
  )
}
