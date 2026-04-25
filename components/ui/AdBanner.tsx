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
    /**
     * Renderiza dois slots de tamanho fixo (mobile 320×50 + desktop 728×90) sem
     * data-full-width-responsive, igual ao modelo de portais de notícias como CNN Brasil.
     * Impede que o AdSense sirva formatos grandes (ex: 300×250) em mobile.
     */
    leaderboard?: boolean
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdBanner({
    slot, format = 'auto', layout, className = '', style,
    minimal = false, hideLabel = false, eager = false, leaderboard = false,
}: AdBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pushedMobile = useRef(false)
    const pushedDesktop = useRef(false)
    const pushed = useRef(false)

    useEffect(() => {
        if (!CLIENT || !slot) return

        const pushOnce = (ref: React.MutableRefObject<boolean>) => {
            if (ref.current) return
            ref.current = true
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            } catch { /* AdSense not loaded yet */ }
        }

        if (leaderboard) {
            // Push both fixed-size slots immediately (above-the-fold)
            pushOnce(pushedMobile)
            pushOnce(pushedDesktop)
            return
        }

        if (pushed.current) return

        const push = () => pushOnce(pushed)

        if (eager) { push(); return }

        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) { push(); observer.disconnect() } },
            { rootMargin: '150px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [slot, eager, leaderboard])

    if (!CLIENT || !slot) return null

    if (leaderboard) {
        return (
            <div className={className}>
                {!hideLabel && (
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted/40 text-center mb-1 select-none">Publicidade</p>
                )}
                {/* Mobile: banner fixo 320×50 — visível apenas abaixo de sm */}
                <div className="flex justify-center sm:hidden" style={{ height: 50, overflow: 'hidden' }}>
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'inline-block', width: 320, height: 50 }}
                        data-ad-client={CLIENT}
                        data-ad-slot={slot}
                        data-full-width-responsive="false"
                    />
                </div>
                {/* Desktop: leaderboard fixo 728×90 — visível apenas a partir de sm */}
                <div className="hidden sm:flex justify-center" style={{ height: 90, overflow: 'hidden' }}>
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'inline-block', width: 728, height: 90 }}
                        data-ad-client={CLIENT}
                        data-ad-slot={slot}
                        data-full-width-responsive="false"
                    />
                </div>
            </div>
        )
    }

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
            <div>
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
