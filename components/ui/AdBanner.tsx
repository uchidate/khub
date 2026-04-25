'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Variantes de anúncio — cada uma tem tamanhos fixos por breakpoint:
 *
 *  leaderboard  topo de página    mobile 320×100 / tablet+ 728×90
 *  banner       mid-content       mobile 320×50  / tablet+ 728×90
 *  rectangle    sidebar           300×250 fixo
 *  fluid        in-article        fluido gerenciado pelo AdSense
 *  multiplex    widget final       discovery widget (autorelaxed)
 */
export type AdVariant = 'leaderboard' | 'banner' | 'rectangle' | 'fluid' | 'multiplex'

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
    // size=null até hydration — evita SSR mismatch e garante que só UM <ins> é criado
    const [size, setSize] = useState<Size | null>(null)

    const isFixed = variant === 'leaderboard' || variant === 'banner' || variant === 'rectangle'

    // Efeito 1 — determina o tamanho correto (requer window) ou configura observer
    useEffect(() => {
        if (!CLIENT || !slot) return

        if (isFixed) {
            setSize(pickSize(variant, window.innerWidth))
            return
        }

        // fluid / multiplex — push via IntersectionObserver ou imediatamente
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
    }, [slot, variant, eager, isFixed])

    // Efeito 2 — push do ad fixo assim que o <ins> é montado (size definido)
    useEffect(() => {
        if (!size || !isFixed || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }, [size, isFixed])

    if (!CLIENT || !slot) return null

    // ── Ads de tamanho fixo (leaderboard, banner, rectangle) ───────────────
    if (isFixed) {
        // Placeholder height antes de saber o breakpoint real
        const ph = variant === 'rectangle' ? 250 : variant === 'leaderboard' ? 100 : 50
        const h = size?.h ?? ph
        const w = size?.w ?? (variant === 'rectangle' ? 300 : 320)

        return (
            <div className={className}>
                <Label minimal={minimal} hideLabel={hideLabel} />
                {/*
                  Duas camadas de contenção:
                  1. Container flex com height+maxHeight+overflow:hidden → impede layout shift
                  2. <ins> com dimensões inline → AdSense respeita width/height explícitos
                     com data-full-width-responsive="false"
                */}
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
