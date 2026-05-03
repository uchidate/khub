'use client'

import { useEffect, useRef, useState } from 'react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME!
const IS_DEV = process.env.NODE_ENV === 'development'

export function HomeNavbarAd() {
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const pushed = useRef(false)

    useEffect(() => {
        setIsMobile(window.innerWidth < 640)
    }, [])

    useEffect(() => {
        if (IS_DEV || !CLIENT || !SLOT || isMobile === null || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }, [isMobile])

    if (isMobile === null) return null

    const w = isMobile ? 320 : 728
    const h = isMobile ? 50 : 90

    if (IS_DEV) {
        return (
            <div className="w-full border-b border-border/40 flex justify-center py-1">
                <div style={{ width: w, height: h }} className="flex items-center justify-center bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded">
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Home Navbar · {w}×{h}</span>
                </div>
            </div>
        )
    }

    if (!CLIENT || !SLOT) return null

    return (
        <div className="w-full border-b border-border/40 flex justify-center py-1">
            <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: w, height: h }}
                data-ad-client={CLIENT}
                data-ad-slot={SLOT}
            />
        </div>
    )
}
