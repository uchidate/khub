'use client'

import { useRef, useEffect, useState, ReactNode } from 'react'

interface ScrollRevealProps {
    children: ReactNode
    direction?: 'up' | 'down' | 'left' | 'right'
    delay?: number
    duration?: number
    className?: string
}

export function ScrollReveal({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.5,
    className = ''
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '-100px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const dirMap: Record<string, string> = {
        up: 'translateY(40px)',
        down: 'translateY(-40px)',
        left: 'translateX(40px)',
        right: 'translateX(-40px)',
    }

    return (
        <div
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translate(0,0)' : dirMap[direction],
                transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
            }}
            className={className}
        >
            {children}
        </div>
    )
}
