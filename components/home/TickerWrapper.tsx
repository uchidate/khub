'use client'

import { usePathname } from 'next/navigation'
import { HomeTicker } from './HomeTicker'

interface TickerNews {
    id: string
    title: string
    tags: string[]
}

const HIDDEN_PATHS = ['/auth', '/admin', '/write']

export function TickerWrapper({ news }: { news: TickerNews[] }) {
    const pathname = usePathname()
    if (HIDDEN_PATHS.some(p => pathname?.startsWith(p))) return null
    return <HomeTicker news={news} />
}
