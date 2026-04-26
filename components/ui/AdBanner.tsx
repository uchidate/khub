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

// Mobile (<640px): tamanho fixo. Desktop: null = Google decide (full-width-responsive)
function pickSize(variant: AdVariant, vw: number): Size | null {
    if (variant === 'rectangle') return { w: 300, h: 250 }
    if (vw >= 640) return null  // desktop: responsive
    switch (variant) {
        case 'leaderboard': return { w: 320, h: 100 }
        case 'banner':      return { w: 320, h: 50 }
        default:            return { w: 320, h: 100 }
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
    // undefined = pré-hydration | null = desktop responsivo | Size = mobile fixo
    const [size, setSize] = useState<Size | null | undefined>(undefined)

    // rectangle é sempre fixo; leaderboard/banner são fixos só no mobile
    const isFixed = variant === 'rectangle'
    const isSizedOnMobile = variant === 'leaderboard' || variant === 'banner'

    const pushAd = () => {
        if (pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }

    // Efeito 1 — determina tamanho (mobile=fixo, desktop=null) ou configura observer
    useEffect(() => {
        if (!CLIENT || !slot) return

        if (isFixed || isSizedOnMobile) {
            setSize(pickSize(variant, window.innerWidth))
            return
        }

        // fluid / multiplex — push via IntersectionObserver ou imediatamente
        if (eager) { pushAd(); return }

        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) { pushAd(); observer.disconnect() } },
            { rootMargin: '150px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slot, variant, eager, isFixed, isSizedOnMobile])

    // Efeito 2 — push assim que o <ins> é montado após size definido
    useEffect(() => {
        if (size === undefined) return        // ainda não hidratou
        if (size !== null) { pushAd(); return } // mobile fixo ou rectangle
        // desktop responsivo: push imediato (sem dimensões fixas)
        if (isSizedOnMobile) pushAd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size])

    if (!CLIENT || !slot) return null

    // ── Rectangle — sempre fixo 300×250 ────────────────────────────────────
    if (isFixed && size) {
        return (
            <div className={className}>
                <Label minimal={minimal} hideLabel={hideLabel} />
                <div className="flex justify-center" style={{ height: size.h, maxHeight: size.h, overflow: 'hidden' }}>
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'inline-block', width: size.w, height: size.h }}
                        data-ad-client={CLIENT}
                        data-ad-slot={slot}
                        data-full-width-responsive="false"
                    />
                </div>
                <Footer minimal={minimal} />
            </div>
        )
    }

    // ── Leaderboard / Banner — fixo no mobile, responsivo no desktop ────────
    if (isSizedOnMobile) {
        if (size === null) {
            // Desktop: Google decide o tamanho
            return (
                <div className={className}>
                    <Label minimal={minimal} hideLabel={hideLabel} />
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client={CLIENT}
                        data-ad-slot={slot}
                        data-full-width-responsive="true"
                    />
                    <Footer minimal={minimal} />
                </div>
            )
        }
        if (size) {
            // Mobile: tamanho fixo com contenção
            return (
                <div className={className}>
                    <Label minimal={minimal} hideLabel={hideLabel} />
                    <div className="flex justify-center" style={{ height: size.h, maxHeight: size.h, overflow: 'hidden' }}>
                        <ins
                            className="adsbygoogle"
                            style={{ display: 'inline-block', width: size.w, height: size.h }}
                            data-ad-client={CLIENT}
                            data-ad-slot={slot}
                            data-full-width-responsive="false"
                        />
                    </div>
                    <Footer minimal={minimal} />
                </div>
            )
        }
        return null // aguardando hydration
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
