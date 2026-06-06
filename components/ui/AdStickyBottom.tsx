'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AdBanner } from '@/components/ui/AdBanner'

// Slot dedicado para sticky bottom; fallback para o slot auto se não configurado
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY || process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO!

const DISMISS_KEY = 'sticky-bottom-dismissed-at'
const DISMISS_TTL = 30 * 60 * 1000 // 30 min
const SCROLL_TRIGGER = 400 // px antes de exibir

export function AdStickyBottom() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Não mostrar se auto ads estão ativos (âncora automática do AdSense pode colidir)
        const settings = (window as unknown as { __adSettings?: { adsAutoAdsEnabled?: boolean } }).__adSettings
        if (settings?.adsAutoAdsEnabled !== false) return

        const ts = sessionStorage.getItem(DISMISS_KEY)
        if (ts && Date.now() - Number(ts) < DISMISS_TTL) return

        const onScroll = () => {
            if (window.scrollY > SCROLL_TRIGGER) {
                setShow(true)
                window.removeEventListener('scroll', onScroll)
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    if (!show || !SLOT) return null

    return (
        <div className="fixed bottom-[var(--bottom-nav-h,56px)] sm:hidden left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-border flex justify-center items-center min-h-[60px]">
            <button
                onClick={() => { setShow(false); sessionStorage.setItem(DISMISS_KEY, String(Date.now())) }}
                className="absolute -top-6 right-2 bg-surface border border-border border-b-0 rounded-t px-2 py-0.5 text-xs text-muted flex items-center gap-1"
                aria-label="Fechar anúncio"
            >
                <X size={11} /> fechar
            </button>
            <AdBanner
                slot={SLOT}
                variant="auto"
                channel="sticky-bottom"
                showFallback={false}
                hideLabel
            />
        </div>
    )
}
