'use client'

import { useEffect, useRef, useState } from 'react'

const COLORS = ['#ff246e', '#b14cff', '#ff6bb0', '#00d4ff']

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
            className={className}
            style={{ color: COLORS[idx], transition: 'color 0.6s ease' }}
        >.</span>
    )
}
