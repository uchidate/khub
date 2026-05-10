'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()
    const isFirst = useRef(true)

    useEffect(() => {
        if (!CLIENT || pathname?.startsWith('/admin')) return

        // Na primeira carga o Script já inicializa o Auto Ads — não interferir
        if (isFirst.current) {
            isFirst.current = false
            return
        }

        // Em navegações SPA: re-injetar o script força o Auto Ads a re-escanear a página
        const existing = document.getElementById('adsense-script-tag')
        if (existing) existing.remove()

        // Aguarda o novo conteúdo renderizar antes de re-injetar
        const timer = setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(window as any).adsbygoogle = undefined

            const script = document.createElement('script')
            script.id = 'adsense-script-tag'
            script.async = true
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
            script.crossOrigin = 'anonymous'
            document.head.appendChild(script)
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
            onLoad={() => { isFirst.current = false }}
        />
    )
}
