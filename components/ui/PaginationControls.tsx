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
        <div className={`mt-10 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface/55 px-4 py-5 sm:px-6 ${className}`}>
            {/* Per-page selector */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-xs text-muted">Itens por página:</span>
                {perPageOptions.map(n => (
                    <button
                        key={n}
                        onClick={() => onPerPageChange(n)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            perPage === n ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted border-border hover:text-foreground hover:border-foreground/30'
                        }`}
                    >
                        {n}
                    </button>
                ))}
                {total !== undefined && (
                    <span className="text-xs text-muted ml-1">{total.toLocaleString('pt-BR')} no total</span>
                )}
            </div>

            {/* Prev / Page / Next */}
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:border-foreground/30 hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                                className="w-12 text-center px-2 py-1 bg-background border border-foreground/30 rounded text-sm text-foreground focus:outline-none"
                            />
                        ) : (
                            <button
                                onClick={() => { setIsEditing(true); setJumpInput(String(currentPage)) }}
                                className="px-2.5 py-1 rounded-md text-sm font-bold text-foreground bg-background border border-border hover:border-foreground/30 transition-colors min-w-[2.2rem] text-center"
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
                        className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:border-foreground/30 hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="hidden md:inline">Próxima</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
