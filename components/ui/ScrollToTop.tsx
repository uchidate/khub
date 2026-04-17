'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => setIsVisible(window.scrollY > 400)
        window.addEventListener('scroll', toggleVisibility, { passive: true })
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

    return (
        <button
            onClick={scrollToTop}
            style={{ transition: 'opacity 0.2s ease-out, transform 0.2s ease-out' }}
            className={`fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 p-3 sm:p-4 bg-[#ff2d78] hover:bg-[#ff2d78]/90 text-white rounded-full shadow-2xl shadow-[#ff2d78]/20 hover:scale-110 active:scale-95 group ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-90 pointer-events-none'
            }`}
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
        >
            <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
        </button>
    )
}
