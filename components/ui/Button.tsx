'use client'

import { Loader2 } from 'lucide-react'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', loading, children, disabled, className = '', ...props }: ButtonProps) {
  const baseClass = 'px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98]'
  const variantClass = {
    primary: 'bg-background text-black hover:bg-[#f0f0f0] shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]',
    secondary: 'bg-[#080808] border border-[#1a1a1a] text-white hover:bg-[#1a1a1a] hover:border-[#2a2a2a]',
    outline: 'border-2 border-[#ff2d78] text-[#ff2d78] hover:bg-[#ff2d78]/10'
  }[variant]

  return (
    <button
      className={`${baseClass} ${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando...
        </span>
      ) : children}
      {variant === 'primary' && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
      )}
    </button>
  )
}
