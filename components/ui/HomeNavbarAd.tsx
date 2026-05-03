'use client'

import { useEffect, useRef } from 'react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME!
const IS_DEV = process.env.NODE_ENV === 'development'

export function HomeNavbarAd() {
    const pushedMobile = useRef(false)
    const pushedDesktop = useRef(false)

    useEffect(() => {
        if (IS_DEV || !CLIENT || !SLOT) return
        try {
            if (!pushedMobile.current) {
                pushedMobile.current = true
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            }
            if (!pushedDesktop.current) {
                pushedDesktop.current = true
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            }
        } catch { /* AdSense ainda não carregou */ }
    }, [])

    if (IS_DEV) {
        return (
            <div className="w-full border-b border-border/40 flex justify-center py-1">
                <div style={{ width: 320, height: 50 }} className="sm:hidden relative flex flex-col items-center justify-center gap-1 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded overflow-hidden">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Home · Abaixo Navbar</span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 select-none">320×50 · mobile banner · fixed</span>
                    <span className="text-[9px] font-mono text-amber-600/60 dark:text-amber-400/60 select-none">slot: {SLOT}</span>
                </div>
                <div style={{ width: 728, height: 90 }} className="hidden sm:flex relative flex-col items-center justify-center gap-1 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded overflow-hidden">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Home · Abaixo Navbar</span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 select-none">728×90 · leaderboard · fixed</span>
                    <span className="text-[9px] font-mono text-amber-600/60 dark:text-amber-400/60 select-none">slot: {SLOT}</span>
                </div>
            </div>
        )
    }

    if (!CLIENT || !SLOT) return null

    return (
        // max-h + overflow-hidden impede AdSense de expandir além da altura definida
        <div className="w-full border-b border-border/40 flex justify-center py-1 max-h-[58px] sm:max-h-[98px] overflow-hidden">
            {/* Mobile: 320×50 — oculto em sm+ */}
            <ins
                className="adsbygoogle sm:hidden"
                style={{ display: 'inline-block', width: '320px', height: '50px' }}
                data-ad-client={CLIENT}
                data-ad-slot={SLOT}
                data-ad-format="fixed"
            />
            {/* Desktop: 728×90 — oculto em mobile */}
            <ins
                className="adsbygoogle hidden sm:inline-block"
                style={{ width: '728px', height: '90px' }}
                data-ad-client={CLIENT}
                data-ad-slot={SLOT}
                data-ad-format="fixed"
            />
        </div>
    )
}
