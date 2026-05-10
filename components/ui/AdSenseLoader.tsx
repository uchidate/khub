'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()
    const mounted = useRef(false)

    useEffect(() => {
        if (!CLIENT || pathname?.startsWith('/admin')) return

        // Ignora a primeira renderização — Script já carrega e inicia o Auto Ads
        if (!mounted.current) {
            mounted.current = true
            return
        }

        // Nas navegações SPA seguintes: empurra novo push para notificar Auto Ads
        // Delay de 300ms para o novo conteúdo da página estar no DOM
        const timer = setTimeout(() => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            } catch { /* adsbygoogle ainda não carregou */ }
        }, 300)

        return () => clearTimeout(timer)
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
