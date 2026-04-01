'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'hallyu_consent'
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

/**
 * Carrega o script do Google AdSense apenas quando o usuário
 * aceitou todos os cookies (LGPD). Evita coleta antes do consentimento.
 */
export function AdSenseLoader() {
    const [granted, setGranted] = useState(false)

    useEffect(() => {
        const check = () => {
            const stored = localStorage.getItem(STORAGE_KEY)
            setGranted(stored === 'all')
        }
        check()
        // Reavalia quando o usuário aceita via outro componente (ex: CookieBanner)
        window.addEventListener('storage', check)
        return () => window.removeEventListener('storage', check)
    }, [])

    if (!CLIENT || !granted) return null

    return (
        <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
        />
    )
}
