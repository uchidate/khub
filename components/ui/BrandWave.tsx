'use client'

import { useEffect, useRef, useState } from 'react'

const COLORS = ['#ff246e', '#b14cff', '#ff6bb0', '#00d4ff']

interface BrandWaveProps {
    width?: number
    height?: number
    duration?: number
    className?: string
}

export function BrandWave({ width = 180, height = 16, duration = 4000, className = '' }: BrandWaveProps) {
    const [idx, setIdx] = useState(0)
    const [t, setT] = useState(0)
    const frameRef = useRef<number>(0)
    const startRef = useRef<number>(0)

    useEffect(() => {
        const animate = (ts: number) => {
            if (!startRef.current) startRef.current = ts
            setT(((ts - startRef.current) % duration) / duration)
            frameRef.current = requestAnimationFrame(animate)
        }
        frameRef.current = requestAnimationFrame(animate)
        const iv = setInterval(() => setIdx(i => (i + 1) % COLORS.length), duration)
        return () => { cancelAnimationFrame(frameRef.current); clearInterval(iv) }
    }, [duration])

    const mid = height / 2
    const amp = height * 0.38
    const points = Array.from({ length: width + 1 }, (_, x) => {
        const y = mid + Math.sin((x / width) * Math.PI * 4 + t * Math.PI * 2) * amp
        return `${x},${y}`
    }).join(' ')

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            style={{ display: 'block' }}
            aria-hidden="true"
        >
            <polyline
                points={points}
                fill="none"
                stroke={COLORS[idx]}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transition: 'stroke 0.6s ease' }}
            />
        </svg>
    )
}

// Versão full-width para dividir seções
export function BrandWaveDivider({ duration = 4000, className = '' }: { duration?: number; className?: string }) {
    const [idx, setIdx] = useState(0)
    const [t, setT] = useState(0)
    const frameRef = useRef<number>(0)
    const startRef = useRef<number>(0)
    const H = 20

    useEffect(() => {
        const animate = (ts: number) => {
            if (!startRef.current) startRef.current = ts
            setT(((ts - startRef.current) % duration) / duration)
            frameRef.current = requestAnimationFrame(animate)
        }
        frameRef.current = requestAnimationFrame(animate)
        const iv = setInterval(() => setIdx(i => (i + 1) % COLORS.length), duration)
        return () => { cancelAnimationFrame(frameRef.current); clearInterval(iv) }
    }, [duration])

    const W = 800, mid = H / 2, amp = H * 0.38
    const points = Array.from({ length: W + 1 }, (_, x) => {
        const y = mid + Math.sin((x / W) * Math.PI * 6 + t * Math.PI * 2) * amp
        return `${x},${y}`
    }).join(' ')

    return (
        <div className={`w-full overflow-hidden ${className}`} style={{ height: H }} aria-hidden="true">
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <polyline
                    points={points}
                    fill="none"
                    stroke={COLORS[idx]}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    style={{ transition: 'stroke 0.6s ease' }}
                />
            </svg>
        </div>
    )
}
