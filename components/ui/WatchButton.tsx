'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BookmarkPlus, ChevronDown, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useWatchlist, WatchStatus, WATCH_STATUS_LABELS, WATCH_STATUS_ICONS } from '@/hooks/useWatchlist'
import { useAuthGate } from '@/lib/hooks/useAuthGate'
import { useToast } from '@/lib/hooks/useToast'
import { StarRating } from '@/components/ui/StarRating'

const STATUS_COLORS: Record<WatchStatus, string> = {
    WANT_TO_WATCH: 'bg-blue-600 hover:bg-blue-500',
    WATCHING: 'bg-yellow-600 hover:bg-yellow-500',
    WATCHED: 'bg-green-600 hover:bg-green-500',
    DROPPED: 'bg-gray-600 hover:bg-gray-500',
}

interface WatchButtonProps {
    productionId: string
    productionName?: string
    className?: string
}

export function WatchButton({ productionId, productionName, className = '' }: WatchButtonProps) {
    const { status: authStatus } = useSession()
    const { getEntry, setEntry, removeEntry, isLoaded } = useWatchlist()
    const openAuthGate = useAuthGate(s => s.open)
    const { addToast } = useToast()

    const [open, setOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [localRating, setLocalRating] = useState<number | null>(null)
    const [localNotes, setLocalNotes] = useState('')
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const entry = isLoaded ? getEntry(productionId) : undefined

    useEffect(() => { setMounted(true) }, [])

    // Sync local state when entry changes
    useEffect(() => {
        if (entry) {
            setLocalRating(entry.rating)
            setLocalNotes(entry.notes ?? '')
        }
    }, [entry])

    // Position dropdown relative to button using fixed coordinates (escapes any overflow:hidden)
    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const dropdownWidth = 288 // w-72 = 18rem = 288px
            // Prevent dropdown from overflowing right edge
            const left = Math.min(rect.left, viewportWidth - dropdownWidth - 8)
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: Math.max(8, left),
                zIndex: 200,
            })
        }
    }, [open])

    // Close on outside click
    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (
                buttonRef.current?.contains(e.target as Node) ||
                dropdownRef.current?.contains(e.target as Node)
            ) return
            setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [open])

    // Close on scroll (dropdown position would be stale)
    useEffect(() => {
        if (!open) return
        const handleScroll = () => setOpen(false)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [open])

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (authStatus === 'unauthenticated') {
            openAuthGate('usar a lista de assistidos')
            return
        }
        setOpen(prev => !prev)
    }

    const handleSelectStatus = (newStatus: WatchStatus) => {
        const data = { status: newStatus, rating: localRating, notes: localNotes || null }
        setEntry(productionId, data)
        addToast({ type: 'success', message: `${WATCH_STATUS_LABELS[newStatus]}!`, duration: 2000 })
        setOpen(false)
    }

    const handleSaveDetails = () => {
        if (!entry) return
        setEntry(productionId, { status: entry.status, rating: localRating, notes: localNotes || null })
        addToast({ type: 'success', message: 'Avaliação salva!', duration: 2000 })
        setOpen(false)
    }

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        removeEntry(productionId)
        addToast({ type: 'info', message: 'Removido da sua lista', duration: 2000 })
        setOpen(false)
    }

    const buttonLabel = entry ? WATCH_STATUS_LABELS[entry.status] : 'Adicionar à lista'
    const buttonIcon = entry ? WATCH_STATUS_ICONS[entry.status] : null
    const buttonBg = entry ? STATUS_COLORS[entry.status] : 'bg-zinc-700 hover:bg-zinc-600'

    const dropdown = (
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        >
            {/* Status options */}
            <div className="p-2">
                {(Object.keys(WATCH_STATUS_LABELS) as WatchStatus[]).map(s => (
                    <button
                        key={s}
                        onClick={() => handleSelectStatus(s)}
                        className={`w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${entry?.status === s ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        {WATCH_STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {/* Rating + notes (only if entry exists) */}
            {entry && (
                <div className="border-t border-zinc-700 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 w-16">Nota:</span>
                        <StarRating value={localRating} onChange={setLocalRating} />
                        {localRating && (
                            <button
                                onClick={() => setLocalRating(null)}
                                className="text-zinc-500 hover:text-zinc-300 ml-1"
                                title="Limpar avaliação"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <div>
                        <textarea
                            value={localNotes}
                            onChange={e => setLocalNotes(e.target.value)}
                            placeholder="Nota privada (opcional)..."
                            rows={2}
                            className="w-full bg-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 border border-zinc-700 focus:outline-none focus:border-zinc-500 resize-none placeholder:text-zinc-500"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleSaveDetails}
                            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg transition-colors"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={handleRemove}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            Remover da lista
                        </button>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <div className={`relative ${className}`}>
            <button
                ref={buttonRef}
                onClick={handleOpen}
                disabled={!isLoaded}
                className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold text-white transition-colors ${buttonBg} ${!isLoaded ? 'opacity-50 cursor-wait' : ''}`}
                aria-label={buttonLabel}
            >
                {buttonIcon ? (
                    <span className="text-base leading-none">{buttonIcon}</span>
                ) : (
                    <BookmarkPlus size={16} />
                )}
                <span>{buttonLabel}</span>
                <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {mounted && open && createPortal(dropdown, document.body)}
        </div>
    )
}
