'use client'

import { useRef, useEffect } from 'react'
import { Construction } from 'lucide-react'

export function BetaBannerClient() {
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = wrapperRef.current
        if (!el) return

        const handleScroll = () => {
            // Manipula DOM diretamente — sem useState, sem re-render
            el.style.gridTemplateRows = window.scrollY < 1 ? '1fr' : '0fr'
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div
            ref={wrapperRef}
            className="sticky top-0 z-[50] w-full"
            style={{
                display: 'grid',
                gridTemplateRows: '1fr',
                transition: 'grid-template-rows 300ms ease-in-out',
            }}
        >
            <div className="overflow-hidden">
                <div className="bg-zinc-950/95 backdrop-blur-sm border-b border-amber-500/30 px-4 h-10 flex items-center justify-center text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-medium">
                        <Construction size={12} className="flex-shrink-0" />
                        <span className="hidden sm:inline">
                            O HallyuHub está em versão beta — alguns recursos ainda estão em desenvolvimento. Sua experiência pode mudar.
                        </span>
                        <span className="sm:hidden">
                            O HallyuHub está em versão beta.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
