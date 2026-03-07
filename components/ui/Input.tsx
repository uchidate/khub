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

      <div className={`flex items-center bg-zinc-900 border rounded-lg transition-all duration-200 ${error ? 'border-red-500 focus-within:ring-red-500' : 'border-zinc-800 focus-within:ring-purple-500'} focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-black`}>
        {icon && (
          <div className="pl-3 text-zinc-400 pointer-events-none flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            flex-1 px-4 py-3 text-sm
            bg-transparent text-white
            placeholder:text-zinc-500
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <div className="pr-3 text-red-500 shrink-0">
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
