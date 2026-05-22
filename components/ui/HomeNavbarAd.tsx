'use client'

import { useEffect, useRef } from 'react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME!
const IS_DEV = process.env.NODE_ENV === 'development'

export function HomeNavbarAd() {
    const pushed = useRef(false)

    useEffect(() => {
        if (IS_DEV || !CLIENT || !SLOT || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }, [])

    if (IS_DEV) {
        return (
            <div className="w-full border-b border-border/40 flex justify-center py-1 min-h-[52px] sm:min-h-[92px]">
                <div className="w-full max-w-[728px] flex flex-col items-center justify-center gap-1 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded overflow-hidden">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Home · Abaixo Navbar</span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 select-none">responsive · auto</span>
                    <span className="text-[9px] font-mono text-amber-600/60 dark:text-amber-400/60 select-none">slot: {SLOT}</span>
                </div>
            </div>
        )
    }

    if (!CLIENT || !SLOT) return null

    return (
        <div className="w-full border-b border-border/40 flex justify-center py-1 overflow-hidden">
            <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', maxWidth: '728px' }}
                data-ad-client={CLIENT}
                data-ad-slot={SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    )
}
