'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR
const IS_DEV = process.env.NODE_ENV === 'development'
// BottomNav mobile height
const BOTTOM_NAV_H = 62

export function StickyBottomAd() {
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)

    useEffect(() => {
        const calc = () => setIsMobile(window.innerWidth < 640)
        calc()
        window.addEventListener('resize', calc)
        return () => window.removeEventListener('resize', calc)
    }, [])

    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (!entry.isIntersecting) setVisible(true) },
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!visible || pushed.current || !CLIENT || !SLOT) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {}
    }, [visible])

    if (IS_DEV) {
        if (isMobile === null) return null
        const w = isMobile ? 320 : 728
        const h = isMobile ? 50 : 90
        const bottom = isMobile ? BOTTOM_NAV_H : 0
        return (
            <div
                className="fixed left-1/2 -translate-x-1/2 z-[190] flex items-center justify-center bg-amber-500/10 border-2 border-dashed border-amber-500/50"
                style={{ width: w, height: h, bottom }}
            >
                <span className="text-[9px] font-mono text-amber-600/60 dark:text-amber-400/60 select-none">📢 Âncora · {w}×{h} · slot: {SLOT}</span>
            </div>
        )
    }

    return (
        <>
            <div ref={sentinelRef} className="absolute top-[300px] left-0 h-px w-px pointer-events-none" aria-hidden />
            {CLIENT && SLOT && !dismissed && visible && (
                <div
                    className="fixed left-0 right-0 z-[190] animate-[slideUp_250ms_ease-out]"
                    style={{
                        bottom: isMobile ? BOTTOM_NAV_H : 0,
                        background: 'rgba(var(--color-background-rgb, 15 15 20), 0.92)',
                        backdropFilter: 'blur(8px)',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div className="flex items-center justify-between px-3 pt-1 pb-0.5">
                        <span className="text-[9px] font-medium uppercase tracking-widest text-muted/40 select-none">Publicidade</span>
                        <button
                            onClick={() => setDismissed(true)}
                            className="flex items-center gap-1 text-[9px] text-muted/40 hover:text-muted transition-colors"
                            aria-label="Fechar anúncio"
                        >
                            <X size={10} />
                            <span className="hidden sm:inline">fechar</span>
                        </button>
                    </div>
                    {/* overflow-hidden força altura máxima mesmo se AdSense tentar expandir */}
                    <div className="flex justify-center pb-1" style={{ maxHeight: `${isMobile ? 50 : 90}px`, overflow: 'hidden' }}>
                        <ins
                            className="adsbygoogle"
                            style={{ display: 'inline-block', width: `${isMobile ? 320 : 728}px`, height: `${isMobile ? 50 : 90}px` }}
                            data-ad-client={CLIENT}
                            data-ad-slot={SLOT}
                            data-ad-format="fixed"
                        />
                    </div>
                </div>
            )}
        </>
    )
}
