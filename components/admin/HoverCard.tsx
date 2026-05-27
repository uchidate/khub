'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface HoverCardProps {
    children: React.ReactNode
    content: React.ReactNode
    delay?: number
}

export function HoverCard({ children, content, delay = 500 }: HoverCardProps) {
    const [visible, setVisible] = useState(false)
    const [coords, setCoords] = useState({ top: 0, left: 0, above: false })
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    const show = useCallback(() => {
        timerRef.current = setTimeout(() => {
            if (!triggerRef.current) return
            const rect = triggerRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const above = spaceBelow < 220 && rect.top > 220
            setCoords({
                top: above ? rect.top - 8 : rect.bottom + 8,
                left: Math.min(rect.left, window.innerWidth - 308),
                above,
            })
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
            {mounted && visible && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: coords.above ? undefined : coords.top,
                        bottom: coords.above ? window.innerHeight - coords.top : undefined,
                        left: coords.left,
                        zIndex: 9999,
                        width: 300,
                        pointerEvents: 'none',
                    }}
                    className="bg-background border border-border rounded-xl shadow-2xl p-3 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    )
}
