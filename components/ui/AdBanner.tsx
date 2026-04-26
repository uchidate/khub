'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Variantes de anúncio:
 *
 *  leaderboard  topo de página    mobile 320×100 / desktop 728×90  (fixo)
 *  banner       mid-content       mobile 320×50  / desktop 728×90  (fixo)
 *  rectangle    sidebar           300×250 fixo
 *  fluid        in-article        fluido gerenciado pelo AdSense
 *  multiplex    widget final       discovery widget (autorelaxed)
 *  auto         responsivo        Google decide tamanho e formato
 */
export type AdVariant = 'leaderboard' | 'banner' | 'rectangle' | 'fluid' | 'multiplex' | 'auto'

interface AdBannerProps {
    slot: string
    variant: AdVariant
    /** Remove separadores e reduz label — ideal para uso dentro de conteúdo */
    minimal?: boolean
    /** Remove completamente o label "Publicidade" */
    hideLabel?: boolean
    /** Carrega imediatamente sem IntersectionObserver */
    eager?: boolean
    className?: string
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

type Size = { w: number; h: number }

function pickSize(variant: AdVariant, vw: number): Size {
    switch (variant) {
        case 'leaderboard':
            return vw < 640 ? { w: 320, h: 100 } : { w: 728, h: 90 }
        case 'banner':
            return vw < 640 ? { w: 320, h: 50 } : { w: 728, h: 90 }
        case 'rectangle':
            return { w: 300, h: 250 }
        default:
            return { w: 320, h: 100 }
    }
}

function Label({ minimal, hideLabel }: { minimal: boolean; hideLabel: boolean }) {
    if (hideLabel) return null
    if (minimal) return (
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted/40 text-center select-none mb-1">
            Publicidade
        </p>
    )
    return (
        <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted/50 select-none">Publicidade</span>
            <div className="flex-1 h-px bg-border" />
        </div>
    )
}

function Footer({ minimal }: { minimal: boolean }) {
    if (minimal) return null
    return (
        <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted/50 select-none">Continua abaixo</span>
            <div className="flex-1 h-px bg-border" />
        </div>
    )
}

export function AdBanner({ slot, variant, minimal = false, hideLabel = false, eager = false, className = '' }: AdBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)
    const [size, setSize] = useState<Size | null>(null)

    const isFixed = variant === 'leaderboard' || variant === 'banner' || variant === 'rectangle'
    const isFluid = variant === 'fluid' || variant === 'multiplex' || variant === 'auto'

    // Efeito 1 — tamanho fixo: calcula após hydration (requer window)
    useEffect(() => {
        if (!CLIENT || !slot) return
        if (isFixed) {
            setSize(pickSize(variant, window.innerWidth))
        }
    }, [slot, variant, isFixed])

    // Efeito 2 — push do ad fixo assim que o <ins> é montado
    useEffect(() => {
        if (!size || !isFixed || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }, [size, isFixed])

    // Efeito 3 — fluid/multiplex/auto: push via IntersectionObserver ou imediatamente
    useEffect(() => {
        if (!CLIENT || !slot || !isFluid) return

        const pushOnce = () => {
            if (pushed.current) return
            pushed.current = true
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            } catch { /* AdSense ainda não carregou */ }
        }

        if (eager) { pushOnce(); return }

        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) { pushOnce(); observer.disconnect() } },
            { rootMargin: '150px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [slot, variant, eager, isFluid])

    if (!CLIENT || !slot) return null

    // ── Ads de tamanho fixo (leaderboard, banner, rectangle) ───────────────
    if (isFixed) {
        const ph = variant === 'rectangle' ? 250 : variant === 'leaderboard' ? 100 : 50
        const h = size?.h ?? ph
        const w = size?.w ?? (variant === 'rectangle' ? 300 : 320)

        return (
            <div className={className}>
                <Label minimal={minimal} hideLabel={hideLabel} />
                <div className="flex justify-center" style={{ height: h, maxHeight: h, overflow: 'hidden' }}>
                    {size && (
                        <ins
                            className="adsbygoogle"
                            style={{ display: 'inline-block', width: w, height: h, maxHeight: h, overflow: 'hidden' }}
                            data-ad-client={CLIENT}
                            data-ad-slot={slot}
                            data-full-width-responsive="false"
                        />
                    )}
                </div>
                <Footer minimal={minimal} />
            </div>
        )
    }

    // ── Auto (responsivo — Google decide tamanho) ────────────────────────────
    if (variant === 'auto') {
        return (
            <div ref={containerRef} className={className}>
                <Label minimal={minimal} hideLabel={hideLabel} />
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client={CLIENT}
                    data-ad-slot={slot}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                />
                <Footer minimal={minimal} />
            </div>
        )
    }

    // ── Fluid / Multiplex ────────────────────────────────────────────────────
    return (
        <div ref={containerRef} className={className}>
            <Label minimal={minimal} hideLabel={hideLabel} />
            <ins
                className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center' }}
                data-ad-client={CLIENT}
                data-ad-slot={slot}
                data-ad-format={variant === 'multiplex' ? 'autorelaxed' : 'fluid'}
                {...(variant === 'fluid' ? { 'data-ad-layout': 'in-article' } : {})}
            />
            <Footer minimal={minimal} />
        </div>
    )
}
