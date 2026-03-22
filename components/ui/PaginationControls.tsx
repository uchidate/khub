'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
    currentPage: number
    totalPages: number
    perPage: number
    perPageOptions?: number[]
    total?: number
    onPageChange: (page: number) => void
    onPerPageChange: (perPage: number) => void
    className?: string
}

export function PaginationControls({
    currentPage,
    totalPages,
    perPage,
    perPageOptions = [50, 100, 150],
    total,
    onPageChange,
    onPerPageChange,
    className = '',
}: PaginationControlsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [jumpInput, setJumpInput] = useState('')

    const commitJump = () => {
        const p = Math.min(totalPages, Math.max(1, parseInt(jumpInput) || currentPage))
        onPageChange(p)
        setIsEditing(false)
        setJumpInput('')
    }

    if (totalPages === 0) return null

    return (
        <div className={`mt-10 flex flex-col items-center gap-3 ${className}`}>
            {/* Per-page selector */}
            <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">Por página:</span>
                {perPageOptions.map(n => (
                    <button
                        key={n}
                        onClick={() => onPerPageChange(n)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                            perPage === n ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-foreground'
                        }`}
                    >
                        {n}
                    </button>
                ))}
                {total !== undefined && (
                    <span className="text-xs text-muted ml-1">({total.toLocaleString('pt-BR')} total)</span>
                )}
            </div>

            {/* Prev / Page / Next */}
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:border-accent hover:text-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden md:inline">Anterior</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                        {isEditing ? (
                            <input
                                autoFocus
                                type="number"
                                min={1}
                                max={totalPages}
                                value={jumpInput}
                                onChange={e => setJumpInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') commitJump()
                                    if (e.key === 'Escape') { setIsEditing(false); setJumpInput('') }
                                }}
                                onBlur={() => { setIsEditing(false); setJumpInput('') }}
                                className="w-12 text-center px-2 py-1 bg-background border border-accent rounded text-sm text-foreground focus:outline-none"
                            />
                        ) : (
                            <button
                                onClick={() => { setIsEditing(true); setJumpInput(String(currentPage)) }}
                                className="px-2 py-1 rounded text-sm font-bold text-foreground bg-surface hover:bg-surface-hover hover:text-accent transition-colors min-w-[2rem] text-center"
                                title="Clique para ir a uma página específica"
                            >
                                {currentPage}
                            </button>
                        )}
                        <span className="text-sm text-muted">/ {totalPages}</span>
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:border-accent hover:text-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="hidden md:inline">Próxima</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
