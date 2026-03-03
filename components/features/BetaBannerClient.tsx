'use client'

import { useState, useEffect } from 'react'
import { Construction } from 'lucide-react'

export function BetaBannerClient() {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const handleScroll = () => setIsVisible(window.scrollY < 1)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div
            className={`sticky top-0 z-[50] w-full overflow-hidden transition-all duration-300 ${
                isVisible ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
        >
            <div className="bg-zinc-950/95 backdrop-blur-sm border-b border-amber-500/30 px-4 h-10 flex items-center justify-center text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-medium">
                    <Construction size={12} className="flex-shrink-0" />
                    <span className="hidden sm:inline">
                        O HallyuHub está em versão beta — alguns recursos ainda estão em desenvolvimento. Sua experiência pode mudar.
                    </span>
                    <span className="sm:hidden text-center">
                        HallyuHub em versão beta — recursos em desenvolvimento.
                    </span>
                </div>
            </div>
        </div>
    )
}
