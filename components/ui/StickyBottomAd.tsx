'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE ?? '1740970038'
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

    // Auto-dismiss após 15s para não travar o mobile
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
            {/* Sentinel: quando sai da viewport, ad aparece */}
            <div ref={sentinelRef} className="absolute top-[300px] left-0 h-px w-px pointer-events-none" aria-hidden />
            {CLIENT && !dismissed && visible && (
                /* bottom-[70px] no mobile para não sobrepor o BottomNav */
                <div className="fixed bottom-[70px] sm:bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.10)] animate-[slideUp_300ms_ease-out]">
                    <div className="relative max-w-4xl mx-auto px-2 py-1">
                        <button
                            onClick={() => setDismissed(true)}
                            className="absolute top-1 right-2 p-1 text-muted hover:text-foreground transition-colors z-10"
                            aria-label="Fechar anúncio"
                        >
                            <X size={14} />
                        </button>
                        <ins
                            className="adsbygoogle"
                            style={{ display: 'block' }}
                            data-ad-client={CLIENT}
                            data-ad-slot={SLOT}
                            data-ad-format="horizontal"
                            data-full-width-responsive="true"
                        />
                    </div>
                </div>
            )}
        </>
    )
}
