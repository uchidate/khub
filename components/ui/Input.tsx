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
          className="block text-sm font-medium text-foreground mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none z-10 flex items-center justify-center">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full ${icon ? 'pl-10' : 'px-4'} ${error ? 'pr-10' : 'pr-4'} py-3 text-sm
            bg-background border border-border rounded-lg
            text-foreground placeholder:text-muted/60
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none
            ${error ? 'border-red-500' : 'focus:border-accent'}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none z-10">
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
          className="mt-2 text-sm text-muted"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
