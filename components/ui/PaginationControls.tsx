'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
    currentPage: number
    totalPages: number
    /** Provide buildHref for link-based (server) pagination — preferred, ensures correct back navigation */
    buildHref?: (page: number) => string
    /** Fallback for client-side pagination (legacy components) */
    onPageChange?: (page: number) => void
    className?: string
    // legacy compat
    perPage?: number
    perPageOptions?: number[]
    total?: number
    onPerPageChange?: (n: number) => void
}

export function PaginationControls({
    currentPage,
    totalPages,
    buildHref,
    onPageChange,
    className = '',
}: PaginationControlsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [jumpInput, setJumpInput] = useState('')

    if (totalPages <= 1) return null

    const goTo = (p: number) => {
        if (p < 1 || p > totalPages) return
        if (buildHref) {
            window.location.assign(buildHref(p))
        } else {
            onPageChange?.(p)
        }
    }

    const commitJump = () => {
        const p = Math.min(totalPages, Math.max(1, parseInt(jumpInput) || currentPage))
        setIsEditing(false)
        setJumpInput('')
        goTo(p)
    }

    const btnClass = (disabled: boolean) =>
        `flex items-center gap-1.5 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:border-foreground/30 hover:text-foreground transition-all ${disabled ? 'opacity-30 pointer-events-none' : ''}`

    return (
        <div className={`mt-10 flex justify-center px-4 py-5 sm:px-6 ${className}`}>
            <div className="flex items-center gap-2">

                <button onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} className={btnClass(currentPage === 1)}>
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

                <button onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} className={btnClass(currentPage === totalPages)}>
                    <span className="hidden md:inline">Próxima</span>
                    <ChevronRight className="w-4 h-4" />
                </button>

            </div>
        </div>
    )
}
