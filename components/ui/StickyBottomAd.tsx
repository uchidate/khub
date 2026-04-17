'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOT = '1740970038'

export function StickyBottomAd() {
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const pushed = useRef(false)

    useEffect(() => {
        const onScroll = () => {
            if (window.scrollY > 300) setVisible(true)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (!visible || pushed.current || !CLIENT) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {}
    }, [visible])

    if (!CLIENT || dismissed || !visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.10)] animate-[slideUp_300ms_ease-out]">
            <div className="relative max-w-4xl mx-auto px-2 py-1">
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-1 right-2 p-1 text-muted hover:text-foreground transition-colors z-10"
                    aria-label="Fechar anúncio"
                >
                    <X size={14} />
                </button>
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client={CLIENT}
                    data-ad-slot={SLOT}
                    data-ad-format="horizontal"
                    data-full-width-responsive="true"
                />
            </div>
        </div>
    )
}
