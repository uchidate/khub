'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()
    if (!CLIENT) return null
    // Não carregar AdSense em páginas admin — evita hydration mismatch
    if (pathname?.startsWith('/admin')) return null
    return (
        <Script
            id="adsense-loader"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
