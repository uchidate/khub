'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    align?: 'left' | 'center'
    className?: string
    backHref?: string
    backLabel?: string
}

export function SectionHeader({ title, subtitle, align = 'left', className = '', backHref, backLabel = 'Início' }: SectionHeaderProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
            { rootMargin: '-50px' }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    const base: React.CSSProperties = {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
    }

    return (
        <div ref={ref} className={`mb-6 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
            {backHref && (
                <Link href={backHref} className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-white transition-colors mb-3 uppercase tracking-wider">
                    <ChevronLeft className="w-3 h-3" />
                    {backLabel}
                </Link>
            )}
            <h1
                style={base}
                className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic"
            >
                {title}
            </h1>
            {subtitle && (
                <p
                    style={{ ...base, transitionDelay: visible ? '0.2s' : '0s' }}
                    className={`text-zinc-500 text-lg font-medium max-w-xl ${align === 'center' ? 'mx-auto' : ''}`}
                >
                    {subtitle}
                </p>
            )}
        </div>
    )
}
