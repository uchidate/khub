'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO ?? '1740970038'
const AUTO_DISMISS_MS = 15_000

export function StickyBottomAd() {
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)

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

    return (
        <>
            <div ref={sentinelRef} className="absolute top-[300px] left-0 h-px w-px pointer-events-none" aria-hidden />
            {CLIENT && !dismissed && visible && (
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
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client={CLIENT}
                        data-ad-slot={SLOT}
                        data-ad-format="horizontal"
                        data-full-width-responsive="true"
                    />
                </div>
            )}
        </>
    )
}
