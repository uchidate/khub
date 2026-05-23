'use client'

import { useEffect, useRef, useState } from 'react'

const COLORS = ['#ff246e', '#b14cff', '#ff6bb0']

export function BrandDot({ className = '' }: { className?: string }) {
    const [idx, setIdx] = useState(0)
    const mounted = useRef(false)

    useEffect(() => {
        mounted.current = true
        const iv = setInterval(() => setIdx(i => (i + 1) % COLORS.length), 4000)
        return () => clearInterval(iv)
    }, [])

    return (
        <span
            aria-hidden="true"
            className={`inline-flex items-end pb-[0.12em] ${className}`}
            style={{ lineHeight: 1 }}
        >
            <svg width="0.22em" height="0.22em" viewBox="0 0 1 1" style={{ display: 'inline-block', transition: 'fill 0.6s ease', fill: COLORS[idx] }}>
                <circle cx="0.5" cy="0.5" r="0.5" />
            </svg>
        </span>
    )
}
