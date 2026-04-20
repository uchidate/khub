'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
    slot: string
    format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical' | 'fluid'
    layout?: 'in-article'
    className?: string
    style?: React.CSSProperties
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdBanner({ slot, format = 'auto', layout, className = '', style }: AdBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)

    useEffect(() => {
        if (!CLIENT || !slot || pushed.current) return

        const el = containerRef.current
        if (!el) return

        // Só inicializa o ad quando o container entrar na viewport
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !pushed.current) {
                    pushed.current = true
                    observer.disconnect()
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
                    } catch {
                        // AdSense not loaded yet
                    }
                }
            },
            { rootMargin: '100px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [slot])

    if (!CLIENT || !slot) return null

    return (
        <div ref={containerRef} className={`overflow-hidden ${className}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted/50 select-none">Publicidade</span>
                <div className="flex-1 h-px bg-border" />
            </div>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center', ...style }}
                data-ad-client={CLIENT}
                data-ad-slot={slot}
                data-ad-format={format}
                {...(layout ? { 'data-ad-layout': layout } : {})}
                {...(format !== 'fluid' ? { 'data-full-width-responsive': 'true' } : {})}
            />
            <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted/50 select-none">Continua abaixo</span>
                <div className="flex-1 h-px bg-border" />
            </div>
        </div>
    )
}
