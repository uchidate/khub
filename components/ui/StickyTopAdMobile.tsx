'use client'

import { useEffect, useRef } from 'react'
import { useAdFilled } from '@/hooks/useAdFilled'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO

export function StickyTopAd() {
    const pushed = useRef(false)
    const { insRef, filled } = useAdFilled(SLOT)

    useEffect(() => {
        if (!CLIENT || !SLOT || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }, [])

    if (!CLIENT || !SLOT || filled === false) return null

    return (
        <div
            className="sticky top-[52px] sm:top-[60px] lg:top-[64px] z-30 bg-background border-b border-border/40"
            style={{ maxHeight: 70, overflow: 'hidden' }}
        >
            {filled === true && (
                <p className="text-[8px] font-semibold uppercase tracking-widest text-muted/30 text-center pt-0.5 select-none">
                    Publicidade
                </p>
            )}
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
    )
}
