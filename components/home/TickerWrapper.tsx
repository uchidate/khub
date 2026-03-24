'use client'

import { usePathname } from 'next/navigation'
import { HomeTicker } from './HomeTicker'

interface TickerPost {
    slug: string
    title: string
    category: { name: string } | null
}

const HIDDEN_PATHS = ['/auth', '/admin', '/write']

export function TickerWrapper({ posts }: { posts: TickerPost[] }) {
    const pathname = usePathname()
    if (HIDDEN_PATHS.some(p => pathname?.startsWith(p))) return null
    return <HomeTicker posts={posts} />
}
