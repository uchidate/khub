'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()

    useEffect(() => {
        if (!CLIENT || pathname?.startsWith('/admin')) return
        if (document.getElementById('adsense-script')) return

        const script = document.createElement('script')
        script.id = 'adsense-script'
        script.async = true
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
    }, [pathname])

    return null
}
