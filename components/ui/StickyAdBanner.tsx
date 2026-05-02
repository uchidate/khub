'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SESSION_KEY = 'sticky_ad_closed'

interface Props {
    slot: string
}

/**
 * Banner fixo mobile-only no bottom da tela.
 * Aparece após 30% de scroll, fechável, não reaparece na mesma sessão.
 */
export function StickyAdBanner({ slot }: Props) {
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const pushed = useRef(false)

    useEffect(() => {
        if (!CLIENT || !slot) return
        if (sessionStorage.getItem(SESSION_KEY)) return

        const threshold = document.documentElement.scrollHeight * 0.3

        const onScroll = () => {
            if (window.scrollY > threshold) {
                setVisible(true)
                window.removeEventListener('scroll', onScroll)
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [slot])

    useEffect(() => {
        if (!visible || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }, [visible])

    const close = () => {
        setDismissed(true)
        sessionStorage.setItem(SESSION_KEY, '1')
    }

    if (!CLIENT || !slot || dismissed || !visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden animate-slide-up">
            <div className="relative bg-background border-t border-border shadow-lg">
                <button
                    onClick={close}
                    aria-label="Fechar anúncio"
                    className="absolute -top-7 right-3 bg-background border border-border rounded-t-lg px-2 py-0.5 flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                >
                    <X className="w-3 h-3" /> Fechar
                </button>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted/40 text-center pt-1 select-none">
                    Publicidade
                </p>
                <div className="flex justify-center pb-1">
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'inline-block', width: 320, height: 50 }}
                        data-ad-client={CLIENT}
                        data-ad-slot={slot}
                        data-full-width-responsive="false"
                    />
                </div>
            </div>
        </div>
    )
}
