'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL
const IS_DEV = process.env.NODE_ENV === 'development'
const MIN_VIEWPORT_WIDTH = 1632
const EXCLUDED_PATH_PREFIXES = ['/admin', '/auth', '/write', '/api']

function isExcludedPath(pathname: string) {
    return EXCLUDED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export function SideRailAds() {
    const pathname = usePathname()
    const [isWide, setIsWide] = useState(false)
    const pushedLeft = useRef(false)
    const pushedRight = useRef(false)

    const visible = isWide && !isExcludedPath(pathname ?? '')

    useEffect(() => {
        const check = () => setIsWide(window.innerWidth >= MIN_VIEWPORT_WIDTH)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    useEffect(() => {
        if (!visible) {
            pushedLeft.current = false
            pushedRight.current = false
        }
    }, [visible])

    useEffect(() => {
        if (IS_DEV || !CLIENT || !SLOT || !visible) return

        try {
            if (!pushedLeft.current) {
                pushedLeft.current = true
                ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            }
            if (!pushedRight.current) {
                pushedRight.current = true
                ;(window.adsbygoogle = window.adsbygoogle || []).push({})
            }
        } catch {
            pushedLeft.current = false
            pushedRight.current = false
        }
    }, [visible])

    if (!visible) return null

    if (IS_DEV) {
        const rail = (side: 'left' | 'right') => (
            <div key={side} className={`fixed ${side}-2 top-1/2 z-20 flex h-[600px] w-[160px] -translate-y-1/2 flex-col items-center justify-center rounded border-2 border-dashed border-amber-500/50 bg-amber-500/10`}>
                <span className="select-none text-[10px] font-semibold text-amber-600 dark:text-amber-400">Side Rail</span>
                <span className="mt-1 select-none font-mono text-[9px] text-amber-600/70 dark:text-amber-400/70">160x600</span>
                <span className="select-none font-mono text-[8px] text-amber-500/40">slot: {SLOT}</span>
            </div>
        )

        return <>{rail('left')}{rail('right')}</>
    }

    if (!CLIENT || !SLOT) return null

    const rail = (side: 'left' | 'right') => (
        <div key={side} className={`fixed ${side}-2 top-1/2 z-20 w-[160px] -translate-y-1/2`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '160px', height: '600px' }}
                data-ad-client={CLIENT}
                data-ad-slot={SLOT}
            />
        </div>
    )

    return <>{rail('left')}{rail('right')}</>
}
