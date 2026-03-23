'use client'

import { Search, X } from 'lucide-react'

interface AdminSearchInputProps {
  value: string
  onChange: (value: string) => void
  /** Called when the X clear button is clicked (after value is cleared) */
  onClear?: () => void
  placeholder?: string
  className?: string
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

/**
 * Standardized search input for admin pages.
 * Matches the public SearchInput style: rounded-xl, bg-background, icon on the right.
 * Shows Search icon when empty, X button when has value.
 */
export function AdminSearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  className,
  onBlur,
  onKeyDown,
}: AdminSearchInputProps) {
  const handleClear = () => {
    onChange('')
    onClear?.()
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full px-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted outline-none focus:border-accent/50 transition-all"
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-foreground transition-colors"
          aria-label="Limpar busca"
        >
          <X size={15} />
        </button>
      ) : (
        <Search
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
      )}
    </div>
  )
}
