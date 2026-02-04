'use client'

import { Loader2 } from 'lucide-react'
import React from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', loading, children, disabled, className = '', ...props }: ButtonProps) {
  const baseClass = 'px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group'
  const variantClass = {
    primary: 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]',
    secondary: 'bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700',
    outline: 'border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10'
  }[variant]

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClass} ${variantClass} ${className}`}
      disabled={disabled || loading}
      {...props as any}
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
    </motion.button>
  )
}
