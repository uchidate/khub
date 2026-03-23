'use client'

import { useEffect, useState } from 'react'

export function ReadingProgressBar() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const updateProgress = () => {
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight
            const scrollTop = window.scrollY
            const scrollable = documentHeight - windowHeight

            if (scrollable > 0) {
                const currentProgress = (scrollTop / scrollable) * 100
                setProgress(currentProgress)
            }
        }

        window.addEventListener('scroll', updateProgress)
        updateProgress() // Initial calculation

        return () => window.removeEventListener('scroll', updateProgress)
    }, [])

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#080808]/50 backdrop-blur-sm">
            <div
                className="h-full bg-[#ff2d78] transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
