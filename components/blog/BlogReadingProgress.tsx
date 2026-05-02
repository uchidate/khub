'use client'

import { useEffect, useRef, useState } from 'react'
import { useUmami } from '@/hooks/useUmami'
import { usePathname } from 'next/navigation'

export function BlogReadingProgress() {
    const [progress, setProgress] = useState(0)
    const { trackScrollDepth, trackBlogRead } = useUmami()
    const pathname = usePathname()
    const slug = pathname.split('/').pop() ?? ''
    const fired = useRef(new Set<number>())

    useEffect(() => {
        fired.current.clear()
    }, [pathname])

    useEffect(() => {
        function onScroll() {
            const el = document.documentElement
            const scrolled = el.scrollTop
            const total = el.scrollHeight - el.clientHeight
            const pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0
            setProgress(pct)

            for (const depth of [25, 50, 75, 100] as const) {
                if (pct >= depth && !fired.current.has(depth)) {
                    fired.current.add(depth)
                    trackScrollDepth(depth, slug)
                    if (depth === 75) {
                        trackBlogRead(slug, document.title)
                    }
                }
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [slug, trackScrollDepth, trackBlogRead])

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none">
            <div
                className="h-full bg-[#ff2d78] transition-[width] duration-75 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
