'use client'

import { useEffect, useState } from 'react'

const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL!
const IS_DEV = process.env.NODE_ENV === 'development'

// Mostra quando há pelo menos 160px de espaço de cada lado do max-w-7xl (1280px)
// threshold: 1280 + 160*2 + 16*2 (padding) = 1632px
const THRESHOLD = 1632

export function SideRailAds() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const check = () => setVisible(window.innerWidth >= THRESHOLD)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Em dev, mostra sempre independente da largura (para testar posicionamento)
    if (!IS_DEV && !visible) return null

    const rail = (side: 'left' | 'right') => (
        <div className={`fixed ${side}-2 top-1/2 -translate-y-1/2 w-[160px] h-[600px] flex flex-col items-center justify-center z-20 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded`}>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 select-none">📢 Side Rail</span>
            <span className="text-[9px] font-mono text-amber-600/70 dark:text-amber-400/70 select-none mt-1">160×600</span>
            <span className="text-[9px] font-mono text-amber-500/50 select-none">wide skyscraper</span>
            <span className="text-[8px] font-mono text-amber-500/40 select-none mt-1">slot: {SLOT}</span>
        </div>
    )

    return (
        <>
            {rail('left')}
            {rail('right')}
        </>
    )
}
