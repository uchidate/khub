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
                <div style={{ width: w, height: h }} className="relative flex flex-col items-center justify-center gap-1 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded overflow-hidden">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Home · Abaixo Navbar</span>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 select-none">{w}×{h}</span>
                        <span className="text-[10px] font-mono text-amber-500/60 select-none">·</span>
                        <span className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80 select-none">fixed size</span>
                        <span className="text-[10px] font-mono text-amber-500/60 select-none">·</span>
                        <span className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80 select-none">leaderboard</span>
                    </div>
                    <span className="text-[9px] font-mono text-amber-600/60 dark:text-amber-400/60 select-none">slot: {SLOT}</span>
                </div>
            </div>
        )
    }

    if (!CLIENT || !SLOT) return null

    return (
        // overflow-hidden + maxHeight garante que o AdSense não expande além do tamanho fixo,
        // mesmo que o slot esteja configurado como responsivo no dashboard
        <div className="w-full border-b border-border/40 flex justify-center py-1" style={{ maxHeight: `${h + 8}px`, overflow: 'hidden' }}>
            <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: w, height: h }}
                data-ad-client={CLIENT}
                data-ad-slot={SLOT}
            />
        </div>
    )
}
