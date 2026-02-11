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
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-900/50 backdrop-blur-sm">
            <div
                className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 transition-all duration-150 ease-out shadow-lg shadow-purple-500/50"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
