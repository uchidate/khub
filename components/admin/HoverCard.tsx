'use client'

import { useState, useRef, useCallback } from 'react'

interface HoverCardProps {
    children: React.ReactNode
    content: React.ReactNode
    delay?: number
}

export function HoverCard({ children, content, delay = 400 }: HoverCardProps) {
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const triggerRef = useRef<HTMLDivElement>(null)

    const show = useCallback(() => {
        timerRef.current = setTimeout(() => {
            if (!triggerRef.current) return
            const rect = triggerRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const top = spaceBelow > 200 ? rect.bottom + 6 : rect.top - 6
            const left = Math.min(rect.left, window.innerWidth - 320 - 8)
            setPos({ top: top + window.scrollY, left })
            setVisible(true)
        }, delay)
    }, [delay])

    const hide = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setVisible(false)
    }, [])

    return (
        <>
            <div ref={triggerRef} onMouseEnter={show} onMouseLeave={hide} className="contents">
                {children}
            </div>
            {visible && (
                <div
                    onMouseEnter={hide}
                    style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 60, width: 300 }}
                    className="bg-background border border-border rounded-xl shadow-2xl p-3 pointer-events-none"
                >
                    {content}
                </div>
            )}
        </>
    )
}
