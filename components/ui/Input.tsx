'use client'

import React, { InputHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-300 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full px-4 py-3
            ${icon ? 'pl-10' : ''}
            bg-zinc-900 text-white
            border rounded-lg
            transition-all duration-200
            placeholder:text-zinc-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-zinc-800 focus:ring-purple-500'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle size={20} />
          </div>
        )}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-slide-down"
          role="alert"
        >
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${inputId}-helper`}
          className="mt-2 text-sm text-zinc-400"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
