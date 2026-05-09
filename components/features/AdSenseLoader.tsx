'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()
    if (!CLIENT) return null
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) return null

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
