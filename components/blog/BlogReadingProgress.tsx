'use client'

import { useEffect, useState } from 'react'

export function BlogReadingProgress() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        function onScroll() {
            const el = document.documentElement
            const scrolled = el.scrollTop
            const total = el.scrollHeight - el.clientHeight
            setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none">
            <div
                className="h-full bg-[#ff2d78] transition-[width] duration-75 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
