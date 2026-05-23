'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL!
const IS_DEV = process.env.NODE_ENV === 'development'
const THRESHOLD = 1632

export function SideRailAds() {
    const pathname = usePathname()
    const [visible, setVisible] = useState(false)
    const pushedLeft = useRef(false)
    const pushedRight = useRef(false)

    useEffect(() => {
        const check = () => setVisible(window.innerWidth >= THRESHOLD)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    useEffect(() => {
        if (IS_DEV || !CLIENT || !SLOT || !visible) return
        try {
            if (!pushedLeft.current) {
                pushedLeft.current = true
                 
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            }
            if (!pushedRight.current) {
                pushedRight.current = true
                 
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            }
        } catch { /* AdSense ainda não carregou */ }
    }, [visible])

    if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/write')) return null

    if (IS_DEV) {
        const rail = (side: 'left' | 'right') => (
            <div key={side} className={`fixed ${side}-2 top-1/2 -translate-y-1/2 w-[160px] h-[600px] flex flex-col items-center justify-center z-20 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded`}>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Side Rail</span>
                <span className="text-[9px] font-mono text-amber-600/70 dark:text-amber-400/70 select-none mt-1">160×600</span>
                <span className="text-[9px] font-mono text-amber-500/50 select-none">wide skyscraper</span>
                <span className="text-[8px] font-mono text-amber-500/40 select-none mt-1">slot: {SLOT}</span>
            </div>
        )
        return <>{rail('left')}{rail('right')}</>
    }

    if (!CLIENT || !SLOT || !visible) return null

    const rail = (side: 'left' | 'right') => (
        <div key={side} className={`fixed ${side}-2 top-1/2 -translate-y-1/2 w-[160px] z-20`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '160px', height: '600px' }}
                data-ad-client={CLIENT}
                data-ad-slot={SLOT}
                data-ad-format="vertical"
            />
        </div>
    )

    return <>{rail('left')}{rail('right')}</>
}
