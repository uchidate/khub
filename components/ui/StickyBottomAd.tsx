'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO
const IS_DEV = process.env.NODE_ENV === 'development'
const BOTTOM_NAV_H = 62

export function StickyBottomAd() {
    const pathname = usePathname()
    const [dismissed, setDismissed] = useState(false)
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const pushed = useRef(false)

    useEffect(() => {
        const calc = () => setIsMobile(window.innerWidth < 640)
        calc()
        window.addEventListener('resize', calc)
        return () => window.removeEventListener('resize', calc)
    }, [])

    // Push só depois que isMobile é resolvido — garante que <ins> está no DOM
    useEffect(() => {
        if (pushed.current || !CLIENT || !SLOT || isMobile === null) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {}
    }, [isMobile])

    if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/write')) return null

    if (isMobile === null) return null

    const w = isMobile ? 320 : 728
    const h = isMobile ? 50 : 90
    const bottom = isMobile ? BOTTOM_NAV_H : 0

    if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/write')) return null

    if (IS_DEV) {
        return (
            <div
                className="fixed left-1/2 -translate-x-1/2 z-[190] flex items-center justify-center bg-amber-500/10 border-2 border-dashed border-amber-500/50"
                style={{ width: w, height: h, bottom }}
            >
                <span className="text-[9px] font-mono text-amber-600/60 dark:text-amber-400/60 select-none">📢 Âncora · {w}×{h} · slot: {SLOT}</span>
            </div>
        )
    }

    if (!CLIENT || !SLOT || dismissed) return null

    return (
        <div
            className="fixed left-0 right-0 z-[190] animate-[slideUp_250ms_ease-out] relative"
            style={{
                bottom,
                background: 'rgba(var(--color-background-rgb, 15 15 20), 0.95)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-0.5 right-1 text-muted/30 hover:text-muted/60 transition-colors z-10"
                aria-label="Fechar anúncio"
            >
                <X size={10} />
            </button>
            <div className="flex justify-center" style={{ height: `${h}px`, overflow: 'hidden' }}>
                <ins
                    className="adsbygoogle"
                    style={{ display: 'inline-block', width: `${w}px`, height: `${h}px` }}
                    data-ad-client={CLIENT}
                    data-ad-slot={SLOT}
                    data-ad-format="fixed"
                />
            </div>
        </div>
    )
}
