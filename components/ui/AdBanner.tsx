'use client'

import { useEffect, useRef, useState } from 'react'

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
    const pushed = useRef(false)
    // leaderboard: aguarda hydration para saber o breakpoint real antes de montar o <ins>
    const [leaderboardSize, setLeaderboardSize] = useState<{ w: number; h: number } | null>(null)

    useEffect(() => {
        if (!CLIENT || !slot) return

        const pushOnce = () => {
            if (pushed.current) return
            pushed.current = true
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            } catch { /* AdSense not loaded yet */ }
        }

        if (leaderboard) {
            // Determina dimensões reais após hydration — só então monta o <ins> e faz push
            const size = window.innerWidth < 640 ? { w: 320, h: 50 } : { w: 728, h: 90 }
            setLeaderboardSize(size)
            // push será feito no próximo efeito após o <ins> ser montado
            return
        }

        if (eager) { pushOnce(); return }

        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) { pushOnce(); observer.disconnect() } },
            { rootMargin: '150px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [slot, eager, leaderboard])

    // Faz push do leaderboard assim que o <ins> for montado no DOM
    useEffect(() => {
        if (!leaderboardSize || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense not loaded yet */ }
    }, [leaderboardSize])

    if (!CLIENT || !slot) return null

    if (leaderboard) {
        return (
            <div className={className}>
                {!hideLabel && (
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted/40 text-center mb-1 select-none">Publicidade</p>
                )}
                {/* Placeholder mantém altura reservada antes de montar o <ins> */}
                <div
                    className="flex justify-center"
                    style={{ height: leaderboardSize?.h ?? 50, overflow: 'hidden' }}
                >
                    {leaderboardSize && (
                        <ins
                            className="adsbygoogle"
                            style={{ display: 'inline-block', width: leaderboardSize.w, height: leaderboardSize.h }}
                            data-ad-client={CLIENT}
                            data-ad-slot={slot}
                            data-full-width-responsive="false"
                        />
                    )}
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
