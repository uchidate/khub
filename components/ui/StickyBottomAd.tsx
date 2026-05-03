'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAdFilled } from '@/hooks/useAdFilled'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR
const IS_DEV = process.env.NODE_ENV === 'development'
const AUTO_DISMISS_MS = 15_000

export function StickyBottomAd() {
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)
    const { insRef, filled } = useAdFilled(SLOT)

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
        if (!visible) return
        const t = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS)
        return () => clearTimeout(t)
    }, [visible])

    useEffect(() => {
        if (!visible || pushed.current || !CLIENT) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {}
    }, [visible])

    if (IS_DEV) {
        if (isMobile === null) return null
        const w = isMobile ? 320 : 728
        const h = isMobile ? 100 : 90
        const bottom = isMobile ? 70 : 0
        return (
            <div
                className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center justify-center bg-black/60 pointer-events-none"
                style={{ width: w, height: h, bottom }}
            >
                <span className="text-[8px] font-mono text-white/20 select-none">{w}×{h} · slot: {SLOT}</span>
            </div>
        )
    }

    return (
        <>
            <div ref={sentinelRef} className="absolute top-[300px] left-0 h-px w-px pointer-events-none" aria-hidden />
            {CLIENT && !dismissed && visible && filled === true && (
                <div className="fixed bottom-[70px] sm:bottom-0 left-0 right-0 z-40 animate-[slideUp_250ms_ease-out]"
                    style={{ background: 'rgba(var(--color-background-rgb, 15 15 20), 0.92)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
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
                    <ins
                        ref={insRef}
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client={CLIENT}
                        data-ad-slot={SLOT}
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                    />
                </div>
            )}
        </>
    )
}
