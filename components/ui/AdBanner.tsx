'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
    slot: string
    format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical' | 'fluid' | 'multiplex'
    layout?: 'in-article'
    className?: string
    style?: React.CSSProperties
    /** Remove separadores "Publicidade / Continua abaixo" — para uso em topo de página */
    minimal?: boolean
    /** Remove completamente o label "Publicidade" */
    hideLabel?: boolean
    /** Carrega imediatamente sem IntersectionObserver — usar apenas para ads above-the-fold */
    eager?: boolean
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

// Altura máxima por formato — impede que o AdSense expanda além do esperado
const FORMAT_MAX_HEIGHT: Record<string, number | undefined> = {
    horizontal: 100,   // leaderboard/banner: 728×90 ou 320×50
    rectangle:  260,   // medium rectangle: 300×250
    vertical:   620,
    auto:       undefined,
    fluid:      undefined,
    multiplex:  undefined,
}

export function AdBanner({
    slot, format = 'auto', layout, className = '', style,
    minimal = false, hideLabel = false, eager = false,
}: AdBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)

    useEffect(() => {
        if (!CLIENT || !slot || pushed.current) return

        const push = () => {
            if (pushed.current) return
            pushed.current = true
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            } catch { /* AdSense not loaded yet */ }
        }

        if (eager) { push(); return }

        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) { push(); observer.disconnect() } },
            { rootMargin: '150px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [slot, eager])

    if (!CLIENT || !slot) return null

    const maxHeight = FORMAT_MAX_HEIGHT[format]

    return (
        <div ref={containerRef} className={`${className}`}>
            {!minimal && (
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-muted/50 select-none">Publicidade</span>
                    <div className="flex-1 h-px bg-border" />
                </div>
            )}
            {minimal && !hideLabel && (
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted/40 text-center mb-1 select-none">Publicidade</p>
            )}
            {/* overflow:hidden + maxHeight no container do <ins> garante que o iframe do AdSense
                não expanda o layout, independente do formato servido */}
            <div style={{ overflow: 'hidden', maxHeight }}>
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block', textAlign: 'center', ...style }}
                    data-ad-client={CLIENT}
                    data-ad-slot={slot}
                    data-ad-format={format === 'multiplex' ? 'autorelaxed' : format}
                    {...(layout ? { 'data-ad-layout': layout } : {})}
                    {...(format !== 'fluid' && format !== 'multiplex' ? { 'data-full-width-responsive': 'true' } : {})}
                />
            </div>
            {!minimal && (
                <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-muted/50 select-none">Continua abaixo</span>
                    <div className="flex-1 h-px bg-border" />
                </div>
            )}
        </div>
    )
}
