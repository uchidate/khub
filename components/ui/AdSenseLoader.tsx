'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()

    // Notifica Auto Ads a cada troca de rota SPA (exceto primeira carga — Script cuida disso)
    useEffect(() => {
        if (!CLIENT || pathname?.startsWith('/admin')) return
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* adsbygoogle ainda não disponível */ }
    }, [pathname])

    if (!CLIENT || pathname?.startsWith('/admin')) return null

    return (
        <Script
            id="adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
