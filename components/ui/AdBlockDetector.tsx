'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const DISMISS_KEY = 'adblock-notice-dismissed'

export function AdBlockDetector() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (sessionStorage.getItem(DISMISS_KEY)) return

        const bait = document.createElement('div')
        // Classes que ad blockers (uBlock, AdBlock Plus) filtram por padrão
        bait.className = 'ad-banner pub_300x250 pub_300x250m pub_728x90 adsbox adsbygoogle'
        bait.setAttribute('aria-hidden', 'true')
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;pointer-events:none;'
        document.body.appendChild(bait)

        const timer = setTimeout(() => {
            const blocked =
                bait.offsetParent === null ||
                bait.offsetHeight === 0 ||
                window.getComputedStyle(bait).display === 'none' ||
                window.getComputedStyle(bait).visibility === 'hidden'
            if (document.body.contains(bait)) document.body.removeChild(bait)
            if (blocked) setVisible(true)
        }, 500)

        return () => {
            clearTimeout(timer)
            if (document.body.contains(bait)) document.body.removeChild(bait)
        }
    }, [])

    if (!visible) return null

    return (
        <div
            role="alert"
            className="fixed bottom-[calc(var(--bottom-nav-h,56px)+12px)] sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-50 bg-surface border border-border rounded-lg p-4 shadow-lg"
        >
            <button
                onClick={() => { setVisible(false); sessionStorage.setItem(DISMISS_KEY, '1') }}
                className="absolute top-2 right-2 text-muted hover:text-foreground transition-colors"
                aria-label="Fechar aviso"
            >
                <X size={14} />
            </button>
            <p className="text-sm font-medium text-foreground pr-4">Ad blocker ativo</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
                O HallyuHub é gratuito graças aos anúncios. Considere nos adicionar à lista de permissões para apoiar o conteúdo.
            </p>
        </div>
    )
}
