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
    const sentinelRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)
    const { insRef, filled } = useAdFilled(SLOT)

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

    if (IS_DEV) return (
        <>
            {/* Mobile: 320×100 */}
            <div className="sm:hidden fixed bottom-[70px] left-1/2 -translate-x-1/2 z-40 w-[320px] h-[100px] flex items-center justify-center bg-black/60 pointer-events-none">
                <span className="text-[8px] font-mono text-white/20 select-none">slot: {SLOT}</span>
            </div>
            {/* Desktop: 728×90 */}
            <div className="hidden sm:flex fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-[728px] h-[90px] items-center justify-center bg-black/60 pointer-events-none">
                <span className="text-[8px] font-mono text-white/20 select-none">slot: {SLOT}</span>
            </div>
        </>
    )

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
