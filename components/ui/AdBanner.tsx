'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
    slot: string
    format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical' | 'fluid'
    layout?: 'in-article'
    className?: string
    style?: React.CSSProperties
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdBanner({ slot, format = 'auto', layout, className = '', style }: AdBannerProps) {
    const pushed = useRef(false)

    useEffect(() => {
        if (!CLIENT || !slot || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {
            // AdSense not loaded yet
        }
    }, [slot])

    if (!CLIENT || !slot) return null

    return (
        <div className={`overflow-hidden text-center ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center', ...style }}
                data-ad-client={CLIENT}
                data-ad-slot={slot}
                data-ad-format={format}
                {...(layout ? { 'data-ad-layout': layout } : {})}
                {...(format !== 'fluid' ? { 'data-full-width-responsive': 'true' } : {})}
            />
        </div>
    )
}
