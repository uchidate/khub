'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
    slot: string
    format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical'
    className?: string
    style?: React.CSSProperties
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdBanner({ slot, format = 'auto', className = '', style }: AdBannerProps) {
    const pushed = useRef(false)

    useEffect(() => {
        if (!CLIENT || !slot || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {
            // AdSense not loaded yet — will retry on next mount
        }
    }, [slot])

    if (!CLIENT || !slot) return null

    return (
        <div className={`overflow-hidden text-center ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', ...style }}
                data-ad-client={CLIENT}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    )
}
