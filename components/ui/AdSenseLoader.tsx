'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()

    useEffect(() => {
        if (!CLIENT || pathname?.startsWith('/admin')) return

        // Injetar script na primeira visita
        if (!document.getElementById('adsense-script')) {
            const script = document.createElement('script')
            script.id = 'adsense-script'
            script.async = true
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
            script.crossOrigin = 'anonymous'
            document.head.appendChild(script)
            return
        }

        // Nas trocas de rota subsequentes, notificar o Auto Ads sobre a nova URL
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const adsbygoogle: unknown[] = (window as any).adsbygoogle || []
            adsbygoogle.push({ google_ad_client: CLIENT, enable_page_level_ads: true })
        } catch { /* adsbygoogle ainda carregando */ }
    }, [pathname])

    return null
}
