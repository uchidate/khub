'use client'

import { Search, X } from 'lucide-react'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    onCommit?: (value: string) => void  // called on Enter or blur (for API-driven searches)
    placeholder?: string
    className?: string
}

export function SearchInput({ value, onChange, onCommit, placeholder = 'Buscar...', className = '' }: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={onCommit ? e => { if (e.key === 'Enter') onCommit(value) } : undefined}
                onBlur={onCommit ? () => onCommit(value) : undefined}
                placeholder={placeholder}
                className="w-full px-4 pr-10 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all"
            />
            {value ? (
                <button
                    onClick={() => { onChange(''); onCommit?.('') }}
                    aria-label="Limpar busca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-foreground transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            )}
        </div>
    )
}
