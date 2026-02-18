'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { GlobalSearch } from '@/components/ui/GlobalSearch'

interface MobileSearchOverlayProps {
    isOpen: boolean
    onClose: () => void
}

export function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // Fecha com ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (isOpen) document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, onClose])

    // Bloqueia scroll do body
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[150] md:hidden flex flex-col">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Search panel */}
            <div
                ref={containerRef}
                className="relative z-10 w-full bg-zinc-900 border-b border-white/10 px-4 py-4 flex items-center gap-3"
            >
                <div className="flex-1">
                    <GlobalSearch />
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    aria-label="Fechar busca"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
